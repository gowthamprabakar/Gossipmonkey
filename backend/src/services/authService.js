import crypto from 'crypto';
import { db, nowIso } from '../db/database.js';

const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 30);
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-chat-monkey-secret';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const parseTokenFromHeader = (headerValue) => {
  if (!headerValue || !headerValue.startsWith('Bearer ')) return null;
  return headerValue.slice(7);
};

export const createSessionToken = (personaId) => {
  const payload = {
    sid: crypto.randomUUID(),
    sub: personaId,
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const token = `${encoded}.${signature}`;

  db.prepare('INSERT INTO sessions (id, persona_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(payload.sid, personaId, hashToken(token), nowIso(), new Date(payload.exp).toISOString());

  return token;
};

export const verifySessionToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const [encoded, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  if (signature !== expected) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!payload?.sid || !payload?.sub || Date.now() > payload.exp) return null;

  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND token_hash = ?').get(payload.sid, hashToken(token));
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;

  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(payload.sub);
  if (!persona || persona.status !== 'active') return null;

  return persona;
};

export const authFromHeader = (headerValue) => {
  const token = parseTokenFromHeader(headerValue);
  if (!token) return null;
  return verifySessionToken(token);
};

export const extractTokenFromHeader = parseTokenFromHeader;

export const revokeSessionToken = (token) => {
  if (!token) return { revoked: false };
  const result = db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  return { revoked: result.changes > 0 };
};
