import { db, nowIso } from '../db/database.js';

const ensurePreferences = (personaId) => {
  const existing = db.prepare('SELECT * FROM persona_preferences WHERE persona_id = ?').get(personaId);
  if (existing) return existing;

  const now = nowIso();
  db.prepare('INSERT INTO persona_preferences (persona_id, allow_location, panic_mode_enabled, updated_at) VALUES (?, 0, 0, ?)').run(personaId, now);
  return db.prepare('SELECT * FROM persona_preferences WHERE persona_id = ?').get(personaId);
};

const asPreferences = (row) => ({
  allowLocation: !!row.allow_location,
  panicModeEnabled: !!row.panic_mode_enabled,
  updatedAt: row.updated_at
});

export const getPrivacyPreferences = (personaId) => {
  const row = ensurePreferences(personaId);
  return asPreferences(row);
};

export const updatePrivacyPreferences = ({ personaId, patch = {} }) => {
  const current = ensurePreferences(personaId);

  const allowLocation = patch.allowLocation === undefined ? !!current.allow_location : !!patch.allowLocation;
  const panicModeEnabled = patch.panicModeEnabled === undefined ? !!current.panic_mode_enabled : !!patch.panicModeEnabled;

  db.prepare(`
    UPDATE persona_preferences
    SET allow_location = ?, panic_mode_enabled = ?, updated_at = ?
    WHERE persona_id = ?
  `).run(allowLocation ? 1 : 0, panicModeEnabled ? 1 : 0, nowIso(), personaId);

  return getPrivacyPreferences(personaId);
};
