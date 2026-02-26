import crypto from 'crypto';
import { db, nowIso } from '../db/database.js';

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
