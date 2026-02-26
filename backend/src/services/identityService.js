import crypto from 'crypto';
import { db, nowIso } from '../db/database.js';

export const upsertPersona = ({ alias, avatar }) => {
  const cleanAlias = String(alias || '').trim().slice(0, 32);
  const cleanAvatar = String(avatar || '').trim();

  if (!cleanAlias || !cleanAvatar) {
    throw new Error('Alias and avatar are required');
  }

  const id = crypto.randomUUID();
  const now = nowIso();
  db.prepare('INSERT INTO personas (id, alias, avatar, score, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, cleanAlias, cleanAvatar, 100, 'active', now, now);

  return db.prepare('SELECT * FROM personas WHERE id = ?').get(id);
};

export const getPersonaStats = (personaId) => {
  const roomsCreated = db.prepare('SELECT COUNT(*) as count FROM rooms WHERE creator_id = ? AND deleted_at IS NULL').get(personaId).count;
  const rewards = db.prepare('SELECT COUNT(*) as count FROM reactions r JOIN messages m ON m.id = r.message_id WHERE m.sender_id = ?').get(personaId).count;
  return { roomsCreated, rewards };
};

export const getPersonaById = (personaId) => db.prepare('SELECT * FROM personas WHERE id = ?').get(personaId);

export const updatePersonaScore = (personaId, delta) => {
  db.prepare('UPDATE personas SET score = MAX(score + ?, 0), updated_at = ? WHERE id = ?').run(delta, nowIso(), personaId);
  return getPersonaById(personaId);
};
