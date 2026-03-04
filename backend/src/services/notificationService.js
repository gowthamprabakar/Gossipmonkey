import crypto from 'crypto';
import { db, nowIso } from '../db/database.js';

// ── Write notification to DB ──────────────────────────────────────
export const createNotification = ({ personaId, roomId = null, type, payload }) => {
  db.prepare('INSERT INTO notifications (id, persona_id, room_id, type, payload_json, read_at, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)')
    .run(crypto.randomUUID(), personaId, roomId, type, JSON.stringify(payload || {}), nowIso());
};

export const listNotifications = ({ personaId, roomId = null, limit = 50 }) => {
  const rows = roomId
    ? db.prepare('SELECT * FROM notifications WHERE persona_id = ? AND room_id = ? ORDER BY created_at DESC LIMIT ?').all(personaId, roomId, limit)
    : db.prepare('SELECT * FROM notifications WHERE persona_id = ? ORDER BY created_at DESC LIMIT ?').all(personaId, limit);

  return rows.map((row) => ({ ...row, payload: JSON.parse(row.payload_json || '{}') }));
};

// ── Send push notification via Expo Push API ──────────────────────
export const pushToPersona = async (personaId, { title, body, data = {} }) => {
  try {
    const persona = db.prepare('SELECT expo_push_token FROM personas WHERE id = ?').get(personaId);
    if (!persona?.expo_push_token) return; // device not registered for push

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: persona.expo_push_token,
        title,
        body,
        data,            // { type, roomId, roomName } — used for deep-link routing
        sound: 'default',
        priority: 'high',
        channelId: 'gossip-monkey',
      }),
    });

    const result = await response.json();
    if (result?.data?.status === 'error') {
      console.warn('[Push] Expo push error:', result.data.message, 'for persona', personaId);
    }
  } catch (err) {
    // Non-critical — push failures should never break socket flow
    console.warn('[Push] Failed to send push notification:', err.message);
  }
};

// ── Combined: write to DB + send push in one call ─────────────────
export const createAndPush = async ({ personaId, roomId = null, type, payload, pushTitle, pushBody }) => {
  // Always write to notification inbox
  createNotification({ personaId, roomId, type, payload });
  // Best-effort push
  await pushToPersona(personaId, {
    title: pushTitle,
    body: pushBody,
    data: { type, roomId, ...payload },
  });
};
