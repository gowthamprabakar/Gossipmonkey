import {
  upsertPersona, loginByCode, getPersonaStats,
  getSessionsForPersona, deleteSessionById, deleteAllOtherSessions,
} from '../services/identityService.js';
import { createSessionToken, extractTokenFromHeader, revokeSessionToken } from '../services/authService.js';
import { db, nowIso } from '../db/database.js';

// ── POST /identity/session — create new persona ──────────────────
export const createSession = (req, res) => {
  try {
    const persona = upsertPersona(req.body || {});
    const token = createSessionToken(persona.id);
    return res.status(201).json({
      success: true,
      data: { persona, token, accountCode: persona.plainAccountCode },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ── POST /identity/login — returning user ────────────────────────
export const loginWithCode = (req, res) => {
  try {
    const { code, password } = req.body || {};
    const persona = loginByCode({ code, password });
    const token = createSessionToken(persona.id);
    return res.status(200).json({ success: true, data: { persona, token } });
  } catch (error) {
    const status = error.message.includes('locked') || error.message.includes('Too many') ? 429 : 401;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// ── GET /identity/me ─────────────────────────────────────────────
export const getMe = (req, res) => {
  const stats = getPersonaStats(req.persona.id);
  return res.json({ success: true, data: { persona: req.persona, stats } });
};

// ── PATCH /identity/me — push token, alias, bio ──────────────────
export const patchMe = (req, res) => {
  const { expoPushToken, alias, bio } = req.body || {};
  const updates = [];
  const values = [];

  if (expoPushToken !== undefined) { updates.push('expo_push_token = ?'); values.push(expoPushToken); }
  if (alias !== undefined) { updates.push('alias = ?'); values.push(alias); }
  if (bio !== undefined) { updates.push('bio = ?'); values.push(bio); }

  if (updates.length > 0) {
    updates.push('updated_at = ?');
    values.push(nowIso(), req.persona.id);
    db.prepare(`UPDATE personas SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }
  const updated = db.prepare('SELECT * FROM personas WHERE id = ?').get(req.persona.id);
  return res.json({ success: true, data: { persona: updated } });
};

// ── POST /identity/panic-reset — revoke current session ──────────
export const panicReset = (req, res) => {
  const token = extractTokenFromHeader(req.headers.authorization || '');
  const result = revokeSessionToken(token);
  return res.json({ success: true, data: { revoked: result.revoked, nextRoute: '/onboarding' } });
};

// ── GET /identity/sessions ────────────────────────────────────────
export const listSessions = (req, res) => {
  const sessions = getSessionsForPersona(req.persona.id);
  return res.json({ success: true, data: { sessions } });
};

// ── DELETE /identity/sessions/:id ────────────────────────────────
export const terminateSession = (req, res) => {
  const result = deleteSessionById(req.params.id, req.persona.id);
  return res.json({ success: true, data: result });
};

// ── DELETE /identity/sessions — terminate all other sessions ─────
export const terminateAllSessions = (req, res) => {
  const token = extractTokenFromHeader(req.headers.authorization || '');
  const payload = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));
  const result = deleteAllOtherSessions(payload.sid, req.persona.id);
  return res.json({ success: true, data: result });
};
