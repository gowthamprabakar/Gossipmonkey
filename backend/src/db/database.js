import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'chatmonkey.db');
export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export const nowIso = () => new Date().toISOString();

const seedSystemData = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      alias TEXT NOT NULL,
      avatar TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (persona_id) REFERENCES personas(id)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      access_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'public',
      rules_text TEXT NOT NULL DEFAULT 'No rules. Go wild.',
      channel_kind TEXT NOT NULL DEFAULT 'general',
      geohash_prefix TEXT,
      region_label TEXT,
      created_at TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (creator_id) REFERENCES personas(id)
    );

    CREATE TABLE IF NOT EXISTS room_settings (
      room_id TEXT PRIMARY KEY,
      approval_required INTEGER NOT NULL DEFAULT 0,
      slow_mode_seconds INTEGER NOT NULL DEFAULT 0,
      image_only INTEGER NOT NULL DEFAULT 0,
      min_score INTEGER NOT NULL DEFAULT 0,
      lock_room INTEGER NOT NULL DEFAULT 0,
      mute_all INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS room_memberships (
      room_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL,
      left_at TEXT,
      PRIMARY KEY (room_id, persona_id, joined_at),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (persona_id) REFERENCES personas(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      text TEXT NOT NULL,
      image_url TEXT,
      message_type TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (sender_id) REFERENCES personas(id)
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      reaction TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(message_id, persona_id),
      FOREIGN KEY (message_id) REFERENCES messages(id),
      FOREIGN KEY (persona_id) REFERENCES personas(id)
    );

    CREATE TABLE IF NOT EXISTS flags (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      flagged_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      resolved_by TEXT,
      resolved_at TEXT,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (message_id) REFERENCES messages(id),
      FOREIGN KEY (flagged_by) REFERENCES personas(id)
    );

    CREATE TABLE IF NOT EXISTS room_bans (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      banned_by TEXT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (persona_id) REFERENCES personas(id),
      FOREIGN KEY (banned_by) REFERENCES personas(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL,
      room_id TEXT,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (persona_id) REFERENCES personas(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS channel_bookmarks (
      persona_id TEXT NOT NULL,
      room_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (persona_id, room_id),
      FOREIGN KEY (persona_id) REFERENCES personas(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS persona_preferences (
      persona_id TEXT PRIMARY KEY,
      allow_location INTEGER NOT NULL DEFAULT 0,
      panic_mode_enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (persona_id) REFERENCES personas(id)
    );

    CREATE TABLE IF NOT EXISTS monkey_memory (
      id          TEXT PRIMARY KEY,
      room_id     TEXT NOT NULL UNIQUE,
      memory_text TEXT NOT NULL,
      summary_count INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_persona_created ON notifications(persona_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_channel_bookmarks_persona ON channel_bookmarks(persona_id, created_at);

    CREATE TABLE IF NOT EXISTS tips (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      from_persona_id TEXT NOT NULL,
      to_persona_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (from_persona_id) REFERENCES personas(id),
      FOREIGN KEY (to_persona_id) REFERENCES personas(id)
    );
  `);

  const globalPersona = db.prepare('SELECT id FROM personas WHERE id = ?').get('system');
  if (!globalPersona) {
    const now = nowIso();
    db.prepare('INSERT INTO personas (id, alias, avatar, score, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run('system', 'System Monkey', 'https://api.dicebear.com/7.x/bottts/svg?seed=System', 1000, 'active', now, now);
  }

  // Ensure the Monkey AI system persona exists (used by monkeyService to persist messages)
  const monkeyPersona = db.prepare('SELECT id FROM personas WHERE id = ?').get('monkey-ai-admin');
  if (!monkeyPersona) {
    const now = nowIso();
    db.prepare('INSERT INTO personas (id, alias, avatar, score, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run('monkey-ai-admin', 'Gossip Monkey', 'https://api.dicebear.com/7.x/bottts/svg?seed=Gossip', 0, 'active', now, now);
  }

  const globalRoom = db.prepare('SELECT id FROM rooms WHERE id = ?').get('global');
  if (!globalRoom) {
    const now = nowIso();
    db.prepare('INSERT INTO rooms (id, access_code, name, creator_id, type, rules_text, created_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)')
      .run('global', 'GLOBAL', 'Global Jungle', 'system', 'public', 'No screaming allowed.', now);
    db.prepare(`INSERT INTO room_settings
      (room_id, approval_required, slow_mode_seconds, image_only, min_score, lock_room, mute_all)
      VALUES (?, 0, 0, 0, 0, 0, 0)`)
      .run('global');
  }

  db.prepare(`
    INSERT INTO persona_preferences (persona_id, allow_location, panic_mode_enabled, updated_at)
    SELECT p.id, 0, 0, ?
    FROM personas p
    WHERE NOT EXISTS (
      SELECT 1 FROM persona_preferences pp WHERE pp.persona_id = p.id
    )
  `).run(nowIso());
};

const hasColumn = (tableName, columnName) => {
  const rows = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return rows.some((row) => row.name === columnName);
};

const runMigrations = () => {
  seedSystemData();

  if (!hasColumn('rooms', 'channel_kind')) {
    db.exec(`ALTER TABLE rooms ADD COLUMN channel_kind TEXT NOT NULL DEFAULT 'general';`);
  }
  if (!hasColumn('rooms', 'geohash_prefix')) {
    db.exec(`ALTER TABLE rooms ADD COLUMN geohash_prefix TEXT;`);
  }
  if (!hasColumn('rooms', 'region_label')) {
    db.exec(`ALTER TABLE rooms ADD COLUMN region_label TEXT;`);
  }
  if (!hasColumn('room_settings', 'monkey_config_json')) {
    db.exec(`ALTER TABLE room_settings ADD COLUMN monkey_config_json TEXT NOT NULL DEFAULT '{}';`);
  }
  // Push notification token
  if (!hasColumn('personas', 'expo_push_token')) {
    db.exec(`ALTER TABLE personas ADD COLUMN expo_push_token TEXT;`);
  }
  // Profile fields
  if (!hasColumn('personas', 'bio')) {
    db.exec(`ALTER TABLE personas ADD COLUMN bio TEXT;`);
  }
  // Auth: account code (human-readable recovery code, e.g. MNKY-X4BZ)
  if (!hasColumn('personas', 'account_code')) {
    db.exec(`ALTER TABLE personas ADD COLUMN account_code TEXT;`);
  }
  // Auth: bcrypt password hash
  if (!hasColumn('personas', 'password_hash')) {
    db.exec(`ALTER TABLE personas ADD COLUMN password_hash TEXT;`);
  }
  // Auth: rate limiting — failed login count + lock expiry
  if (!hasColumn('personas', 'failed_attempts')) {
    db.exec(`ALTER TABLE personas ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0;`);
  }
  if (!hasColumn('personas', 'locked_until')) {
    db.exec(`ALTER TABLE personas ADD COLUMN locked_until TEXT;`);
  }
  // Messages: replies to other messages
  if (!hasColumn('messages', 'reply_to_id')) {
    db.exec(`ALTER TABLE messages ADD COLUMN reply_to_id TEXT REFERENCES messages(id);`);
  }

  // Transactions: Banana Tips between users
  db.exec(`
    CREATE TABLE IF NOT EXISTS tips (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      from_persona_id TEXT NOT NULL,
      to_persona_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (from_persona_id) REFERENCES personas(id),
      FOREIGN KEY (to_persona_id) REFERENCES personas(id)
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_rooms_kind_created ON rooms(channel_kind, created_at);
    CREATE INDEX IF NOT EXISTS idx_rooms_geohash ON rooms(geohash_prefix);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_personas_account_code ON personas(account_code) WHERE account_code IS NOT NULL;
  `);
};

export const resetDatabaseForTests = () => {
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM room_bans;
    DELETE FROM flags;
    DELETE FROM reactions;
    DELETE FROM messages;
    DELETE FROM room_memberships;
    DELETE FROM channel_bookmarks;
    DELETE FROM persona_preferences;
    DELETE FROM room_settings;
    DELETE FROM rooms WHERE id != 'global';
    DELETE FROM sessions;
    DELETE FROM personas WHERE id != 'system';
  `);
  seedSystemData();
};

runMigrations();
