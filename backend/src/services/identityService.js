import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, nowIso } from '../db/database.js';

// ── Account code generator (MNKY-XXXX format) ────────────────────
const generateAccountCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1 confusion
  let code = '';
  let attempts = 0;
  do {
    const part = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    code = `MNKY-${part}`;
    const existing = db.prepare('SELECT id FROM personas WHERE account_code = ?').get(code);
    if (!existing) break;
    attempts++;
  } while (attempts < 20);
  return code;
};

// ── Create new persona ────────────────────────────────────────────
export const upsertPersona = ({ alias, avatar, password }) => {
  const cleanAlias = String(alias || '').trim().slice(0, 32);
  const cleanAvatar = String(avatar || '').trim();

  if (!cleanAlias || !cleanAvatar) throw new Error('Alias and avatar are required');
  // If no password provided, generate a random secure one (user won't know it — they login via code only)
  const actualPassword = password && password.length >= 8
    ? password
    : Array.from({ length: 16 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'.charAt(Math.floor(Math.random() * 57))).join('');

  const id = crypto.randomUUID();
  const now = nowIso();
  const accountCode = generateAccountCode();
  const passwordHash = bcrypt.hashSync(actualPassword, 12);

  db.prepare(`
    INSERT INTO personas (id, alias, avatar, score, status, account_code, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, cleanAlias, cleanAvatar, 100, 'active', accountCode, passwordHash, now, now);

  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(id);
  // Return plaintext code only this once — never stored plain again
  return { ...persona, plainAccountCode: accountCode };
};

// ── Login with account code + password ───────────────────────────
export const loginByCode = ({ code, password }) => {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode || !password) throw new Error('Account code and password are required');

  const persona = db.prepare('SELECT * FROM personas WHERE account_code = ?').get(cleanCode);
  if (!persona || persona.status !== 'active') {
    throw new Error('Account not found. Check your code and try again.');
  }

  // Rate limiting check
  if (persona.locked_until && new Date(persona.locked_until) > new Date()) {
    const secsLeft = Math.ceil((new Date(persona.locked_until) - new Date()) / 1000);
    throw new Error(`Too many attempts. Try again in ${Math.ceil(secsLeft / 60)} minute(s).`);
  }

  const passwordMatch = bcrypt.compareSync(password, persona.password_hash || '');
  if (!passwordMatch) {
    const newAttempts = (persona.failed_attempts || 0) + 1;
    if (newAttempts >= 5) {
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      db.prepare('UPDATE personas SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?')
        .run(newAttempts, lockedUntil, nowIso(), persona.id);
      throw new Error('Too many failed attempts. Account locked for 15 minutes.');
    }
    db.prepare('UPDATE personas SET failed_attempts = ?, updated_at = ? WHERE id = ?')
      .run(newAttempts, nowIso(), persona.id);
    const remaining = 5 - newAttempts;
    throw new Error(`Wrong password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
  }

  // Success — reset counters
  db.prepare('UPDATE personas SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?')
    .run(nowIso(), persona.id);

  return persona;
};

// ── Stats ────────────────────────────────────────────────────────
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

// ── Session management ────────────────────────────────────────────
export const getSessionsForPersona = (personaId) => {
  return db.prepare('SELECT id, created_at, expires_at FROM sessions WHERE persona_id = ? ORDER BY created_at DESC').all(personaId);
};

export const deleteSessionById = (sessionId, personaId) => {
  const result = db.prepare('DELETE FROM sessions WHERE id = ? AND persona_id = ?').run(sessionId, personaId);
  return { deleted: result.changes > 0 };
};

export const deleteAllOtherSessions = (currentSessionId, personaId) => {
  const result = db.prepare('DELETE FROM sessions WHERE persona_id = ? AND id != ?').run(personaId, currentSessionId);
  return { deleted: result.changes };
};
