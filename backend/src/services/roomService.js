import crypto from 'crypto';
import { db, nowIso } from '../db/database.js';
import { createNotification } from './notificationService.js';
import { updatePersonaScore, getPersonaById } from './identityService.js';

export const DEFAULT_MONKEY_CONFIG = {
  // Identity
  name: 'Gossip Monkey',
  avatarSeed: 'Gossip',

  // Personality
  personality: 'sarcastic',
  customPrompt: '',

  // Triggers
  triggerWords: ['monkey'],
  replyFrequency: 0.2,
  maxReplyLength: 280,

  // Rewards
  aiRewardAmount: 2,
  maxDailyRewardPerUser: 20,

  // Welcome
  welcomeMessage: '',

  // Heartbeat
  heartbeatEnabled: false,
  heartbeatIntervalMinutes: 10,

  // Hooks — which internal events trigger the Monkey
  hooksEnabled: {
    user_joined: false,
    user_left: false,
    user_kicked: true,
    user_banned: false,
    room_locked: true,
    room_unlocked: true,
    room_muted: true,
    room_unmuted: false,
    paint_triggered: false,
    image_shared: false
  },

  // Crons — admin-scheduled recurring tasks (max 5)
  crons: [],

  // Webhooks
  webhookSecret: '',
  webhookRateLimitPerMinute: 10,

  // Monkey Bank — budget for autonomous /paint
  monkeyBankBalance: 50,
  monkeyBankDailyReset: 50
};

const parseMonkeyConfig = (raw) => {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
    return { ...DEFAULT_MONKEY_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_MONKEY_CONFIG };
  }
};

const normalizeSettings = (settings = {}) => ({
  approvalRequired: !!settings.approvalRequired,
  slowModeSeconds: Number(settings.slowModeSeconds || 0),
  imageOnly: !!settings.imageOnly,
  minScore: Number(settings.minScore || 0),
  lockRoom: !!settings.lockRoom,
  muteAll: !!settings.muteAll
});

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const asRoom = (row) => ({
  id: row.id,
  accessCode: row.access_code,
  name: row.name,
  creatorId: row.creator_id,
  type: row.type,
  rules: row.rules_text,
  createdAt: row.created_at,
  deletedAt: row.deleted_at,
  channelMeta: {
    channelKind: row.channel_kind || 'general',
    geohashPrefix: row.geohash_prefix || null,
    regionLabel: row.region_label || null,
    isBookmarked: !!row.is_bookmarked
  },
  settings: {
    approvalRequired: !!row.approval_required,
    slowModeSeconds: row.slow_mode_seconds,
    imageOnly: !!row.image_only,
    minScore: row.min_score,
    lockRoom: !!row.lock_room,
    muteAll: !!row.mute_all
  },
  monkeyConfig: parseMonkeyConfig(row.monkey_config_json),
  requiresApproval: !!row.approval_required,
  locked: !!row.lock_room,
  mutedAll: !!row.mute_all,
  activeCount: Number(row.active_count || 0)
});

export const listRooms = () => {
  const rows = db.prepare(`
    SELECT r.*, s.approval_required, s.slow_mode_seconds, s.image_only, s.min_score, s.lock_room, s.mute_all, s.monkey_config_json,
    (SELECT COUNT(DISTINCT rm.persona_id) FROM room_memberships rm WHERE rm.room_id = r.id AND rm.left_at IS NULL) as active_count
    FROM rooms r
    JOIN room_settings s ON s.room_id = r.id
    WHERE r.deleted_at IS NULL
    ORDER BY active_count DESC, r.created_at DESC
  `).all();

  return rows.map(asRoom);
};

export const getRoomById = (roomId) => {
  const row = db.prepare(`
    SELECT r.*, s.approval_required, s.slow_mode_seconds, s.image_only, s.min_score, s.lock_room, s.mute_all, s.monkey_config_json,
    (SELECT COUNT(DISTINCT rm.persona_id) FROM room_memberships rm WHERE rm.room_id = r.id AND rm.left_at IS NULL) as active_count
    FROM rooms r
    JOIN room_settings s ON s.room_id = r.id
    WHERE r.id = ? AND r.deleted_at IS NULL
  `).get(roomId);

  return row ? asRoom(row) : null;
};

export const createRoom = ({ personaId, name, type, rulesText, settings, channelMeta = {} }) => {
  const cleanName = String(name || '').trim().slice(0, 64);
  if (!cleanName) throw new Error('Room name is required');

  const id = crypto.randomUUID();
  const accessCode = randomCode();
  const now = nowIso();
  const normalized = normalizeSettings(settings);

  const channelKind = String(channelMeta.channelKind || 'general').trim() || 'general';
  const geohashPrefix = channelMeta.geohashPrefix ? String(channelMeta.geohashPrefix).trim().slice(0, 12) : null;
  const regionLabel = channelMeta.regionLabel ? String(channelMeta.regionLabel).trim().slice(0, 64) : null;

  db.prepare('INSERT INTO rooms (id, access_code, name, creator_id, type, rules_text, channel_kind, geohash_prefix, region_label, created_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)')
    .run(
      id,
      accessCode,
      cleanName,
      personaId,
      type || 'public',
      String(rulesText || 'No rules. Go wild.'),
      channelKind,
      geohashPrefix,
      regionLabel,
      now
    );

  const initialMonkeyConfig = {
    ...DEFAULT_MONKEY_CONFIG,
    webhookSecret: crypto.randomBytes(32).toString('hex')
  };

  db.prepare(`INSERT INTO room_settings
    (room_id, approval_required, slow_mode_seconds, image_only, min_score, lock_room, mute_all, monkey_config_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      id,
      normalized.approvalRequired ? 1 : 0,
      Math.max(normalized.slowModeSeconds, 0),
      normalized.imageOnly ? 1 : 0,
      Math.max(normalized.minScore, 0),
      normalized.lockRoom ? 1 : 0,
      normalized.muteAll ? 1 : 0,
      JSON.stringify(initialMonkeyConfig)
    );

  return getRoomById(id);
};

export const isRoomAdmin = ({ roomId, personaId }) => {
  const room = db.prepare('SELECT creator_id FROM rooms WHERE id = ? AND deleted_at IS NULL').get(roomId);
  return !!room && room.creator_id === personaId;
};

export const updateRoomSettings = ({ roomId, personaId, patch }) => {
  if (!isRoomAdmin({ roomId, personaId })) {
    throw new Error('Only room admin can update settings');
  }

  const current = db.prepare('SELECT * FROM room_settings WHERE room_id = ?').get(roomId);
  if (!current) throw new Error('Room not found');

  const normalized = normalizeSettings({
    approvalRequired: patch.approvalRequired ?? current.approval_required,
    slowModeSeconds: patch.slowModeSeconds ?? current.slow_mode_seconds,
    imageOnly: patch.imageOnly ?? current.image_only,
    minScore: patch.minScore ?? current.min_score,
    lockRoom: patch.lockRoom ?? current.lock_room,
    muteAll: patch.muteAll ?? current.mute_all
  });

  // Merge monkeyConfig patch if provided
  const currentMonkeyConfig = parseMonkeyConfig(current.monkey_config_json);
  const newMonkeyConfig = patch.monkeyConfig
    ? { ...currentMonkeyConfig, ...patch.monkeyConfig }
    : currentMonkeyConfig;

  db.prepare(`UPDATE room_settings
    SET approval_required = ?, slow_mode_seconds = ?, image_only = ?, min_score = ?, lock_room = ?, mute_all = ?, monkey_config_json = ?
    WHERE room_id = ?`)
    .run(
      normalized.approvalRequired ? 1 : 0,
      Math.max(normalized.slowModeSeconds, 0),
      normalized.imageOnly ? 1 : 0,
      Math.max(normalized.minScore, 0),
      normalized.lockRoom ? 1 : 0,
      normalized.muteAll ? 1 : 0,
      JSON.stringify(newMonkeyConfig),
      roomId
    );

  return getRoomById(roomId);
};

export const ensureRoomJoinAllowed = ({ roomId, personaId }) => {
  const room = getRoomById(roomId);
  if (!room) throw new Error('Room not found');

  const persona = getPersonaById(personaId);
  if (!persona) throw new Error('Persona not found');

  const activeBan = db.prepare('SELECT id FROM room_bans WHERE room_id = ? AND persona_id = ? AND revoked_at IS NULL').get(roomId, personaId);
  if (activeBan) throw new Error('You are banned from this room');

  if (room.locked && room.creatorId !== personaId) throw new Error('Room is locked');
  if (room.settings.minScore > persona.score) throw new Error('Minimum score requirement not met');

  return { room, persona };
};

export const markJoined = ({ roomId, personaId }) => {
  db.prepare('UPDATE room_memberships SET left_at = ? WHERE room_id = ? AND persona_id = ? AND left_at IS NULL').run(nowIso(), roomId, personaId);
  db.prepare('INSERT INTO room_memberships (room_id, persona_id, role, joined_at, left_at) VALUES (?, ?, ?, ?, NULL)')
    .run(roomId, personaId, isRoomAdmin({ roomId, personaId }) ? 'admin' : 'member', nowIso());
};

export const markLeft = ({ roomId, personaId }) => {
  db.prepare('UPDATE room_memberships SET left_at = ? WHERE room_id = ? AND persona_id = ? AND left_at IS NULL').run(nowIso(), roomId, personaId);
};

export const listParticipants = (roomId) => {
  return db.prepare(`
    SELECT p.id, p.alias, p.avatar, p.score,
      CASE WHEN r.creator_id = p.id THEN 'admin' ELSE 'member' END as role
    FROM room_memberships rm
    JOIN personas p ON p.id = rm.persona_id
    JOIN rooms r ON r.id = rm.room_id
    WHERE rm.room_id = ? AND rm.left_at IS NULL
    GROUP BY p.id
    ORDER BY role DESC, p.alias ASC
  `).all(roomId);
};

export const getRecentMessages = (roomId, limit = 100) => {
  const rows = db.prepare(`
    SELECT m.*, p.alias as sender_name, p.avatar as sender_avatar,
           r.id as reply_to_id, r.text as reply_to_text, rp.alias as reply_to_sender_name
    FROM messages m
    JOIN personas p ON p.id = m.sender_id
    LEFT JOIN messages r ON r.id = m.reply_to_id AND r.deleted_at IS NULL
    LEFT JOIN personas rp ON rp.id = r.sender_id
    WHERE m.room_id = ? AND m.deleted_at IS NULL
    ORDER BY m.created_at ASC
    LIMIT ?
  `).all(roomId, limit);

  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    imageUrl: row.image_url,
    type: row.message_type,
    timestamp: row.created_at,
    sender: {
      id: row.sender_id,
      name: row.sender_name,
      avatar: row.sender_avatar,
      role: row.message_type === 'monkey_action' ? 'admin' : 'member'
    },
    replyTo: row.reply_to_id ? {
      id: row.reply_to_id,
      text: row.reply_to_text,
      senderName: row.reply_to_sender_name
    } : undefined,
    reactions: getMessageReactions(row.id)
  }));
};

export const canSendMessage = ({ roomId, personaId, text, imageUrl = null }) => {
  const room = getRoomById(roomId);
  if (!room) throw new Error('Room not found');

  const isAdmin = room.creatorId === personaId;

  if (room.settings.muteAll && !isAdmin) {
    throw new Error('Room is muted by admin');
  }

  const hasImage = !!String(imageUrl || '').trim();
  const hasText = !!String(text || '').trim();

  // Must have either text or an image
  if (!hasText && !hasImage) {
    throw new Error('Message cannot be empty');
  }

  if (room.settings.imageOnly && !String(text).startsWith('/paint ') && !hasImage) {
    throw new Error('Room allows images only. Share an image or use /paint');
  }

  if (room.settings.slowModeSeconds > 0 && !isAdmin) {
    const last = db.prepare('SELECT created_at FROM messages WHERE room_id = ? AND sender_id = ? ORDER BY created_at DESC LIMIT 1').get(roomId, personaId);
    if (last) {
      const elapsed = Date.now() - new Date(last.created_at).getTime();
      if (elapsed < room.settings.slowModeSeconds * 1000) {
        throw new Error(`Slow mode active. Wait ${Math.ceil((room.settings.slowModeSeconds * 1000 - elapsed) / 1000)}s`);
      }
    }
  }

  return room;
};

export const createMessage = ({ roomId, senderId, text, imageUrl = null, type = 'user', replyToId = null }) => {
  const id = crypto.randomUUID();
  const createdAt = nowIso();
  const cleanText = String(text || '').slice(0, 2000);
  db.prepare('INSERT INTO messages (id, room_id, sender_id, text, image_url, message_type, created_at, deleted_at, reply_to_id) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)')
    .run(id, roomId, senderId, cleanText, imageUrl, type, createdAt, replyToId);

  let replyToData = undefined;
  if (replyToId) {
    const parent = db.prepare(`
      SELECT m.id, m.text, p.alias as sender_name 
      FROM messages m JOIN personas p ON p.id = m.sender_id 
      WHERE m.id = ?`).get(replyToId);
    if (parent) {
      replyToData = { id: parent.id, text: parent.text, senderName: parent.sender_name };
    }
  }

  const persona = getPersonaById(senderId);
  return {
    id,
    text: cleanText,
    imageUrl: imageUrl,
    type,
    timestamp: createdAt,
    sender: { id: senderId, name: persona.alias, avatar: persona.avatar, role: type === 'monkey_action' ? 'admin' : 'member' },
    replyTo: replyToData,
    reactions: {}
  };
};

export const getMessageById = (messageId) => db.prepare('SELECT * FROM messages WHERE id = ? AND deleted_at IS NULL').get(messageId);

export const deleteMessageByAdmin = ({ roomId, messageId, requesterId }) => {
  const message = getMessageById(messageId);
  if (!message || message.room_id !== roomId) throw new Error('Message not found');
  const isAdmin = isRoomAdmin({ roomId, personaId: requesterId });
  const isSender = message.sender_id === requesterId;
  if (!isAdmin && !isSender) throw new Error('Only the sender or an admin can delete this message');
  db.prepare('UPDATE messages SET deleted_at = ? WHERE id = ? AND room_id = ?').run(nowIso(), messageId, roomId);
};

export const toggleReaction = ({ roomId, messageId, reaction, personaId }) => {
  const message = getMessageById(messageId);
  if (!message || message.room_id !== roomId) throw new Error('Message not found');
  if (message.sender_id === personaId) throw new Error('Cannot react to your own message');

  const existing = db.prepare('SELECT * FROM reactions WHERE message_id = ? AND persona_id = ?').get(messageId, personaId);

  if (existing && existing.reaction === reaction) {
    db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
  } else if (existing) {
    db.prepare('UPDATE reactions SET reaction = ?, created_at = ? WHERE id = ?').run(reaction, nowIso(), existing.id);
  } else {
    db.prepare('INSERT INTO reactions (id, message_id, persona_id, reaction, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), messageId, personaId, reaction, nowIso());

    // Any new reaction earns the message author +1 banana 🍌
    // (removing a reaction or changing it does not deduct — rewards are final)
    updatePersonaScore(message.sender_id, 1);
  }

  return {
    id: messageId,
    reactions: getMessageReactions(messageId)
  };
};

export const getMessageReactions = (messageId) => {
  const rows = db.prepare('SELECT persona_id, reaction FROM reactions WHERE message_id = ?').all(messageId);
  return rows.reduce((acc, row) => {
    acc[row.persona_id] = row.reaction;
    return acc;
  }, {});
};

export const flagMessage = ({ roomId, messageId, flaggedBy }) => {
  const message = getMessageById(messageId);
  if (!message || message.room_id !== roomId) throw new Error('Message not found');

  const existing = db.prepare('SELECT id FROM flags WHERE room_id = ? AND message_id = ? AND flagged_by = ?').get(roomId, messageId, flaggedBy);
  if (existing) return null;

  const id = crypto.randomUUID();
  db.prepare('INSERT INTO flags (id, room_id, message_id, flagged_by, status, created_at, resolved_by, resolved_at) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)')
    .run(id, roomId, messageId, flaggedBy, 'open', nowIso());

  const room = getRoomById(roomId);
  if (room) {
    createNotification({
      personaId: room.creatorId,
      roomId,
      type: 'flagged_message',
      payload: { messageId, flaggedBy }
    });
  }

  return id;
};

export const listRoomFlags = (roomId) => {
  return db.prepare(`
    SELECT f.id, f.message_id, f.flagged_by, f.created_at, m.text
    FROM flags f
    JOIN messages m ON m.id = f.message_id
    WHERE f.room_id = ? AND f.status = 'open'
    ORDER BY f.created_at DESC
  `).all(roomId);
};

export const resolveFlag = ({ roomId, flagId, requesterId }) => {
  if (!isRoomAdmin({ roomId, personaId: requesterId })) throw new Error('Only admin can resolve flags');
  db.prepare('UPDATE flags SET status = ?, resolved_by = ?, resolved_at = ? WHERE id = ? AND room_id = ?')
    .run('resolved', requesterId, nowIso(), flagId, roomId);
};

export const tipUser = ({ roomId, fromUserId, toUserId, amount }) => {
  const room = getRoomById(roomId);
  if (!room) throw new Error('Room not found');

  const sender = getPersonaById(fromUserId);
  if (!sender || sender.score < amount) throw new Error('Not enough bananas');

  // Insert tip transaction record
  db.prepare('INSERT INTO tips (id, room_id, from_persona_id, to_persona_id, amount, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), roomId, fromUserId, toUserId, amount, nowIso());

  // Update balances
  updatePersonaScore(fromUserId, -amount);
  updatePersonaScore(toUserId, amount);

  return {
    from: getPersonaById(fromUserId),
    to: getPersonaById(toUserId)
  };
};

export const kickUser = ({ roomId, requesterId, targetUserId }) => {
  if (!isRoomAdmin({ roomId, personaId: requesterId })) throw new Error('Only admin can kick users');

  db.prepare('INSERT INTO room_bans (id, room_id, persona_id, banned_by, reason, created_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, NULL)')
    .run(crypto.randomUUID(), roomId, targetUserId, requesterId, 'kicked', nowIso());

  markLeft({ roomId, personaId: targetUserId });
};

export const unbanUser = ({ roomId, requesterId, targetUserId }) => {
  if (!isRoomAdmin({ roomId, personaId: requesterId })) throw new Error('Only admin can unban users');

  db.prepare('UPDATE room_bans SET revoked_at = ? WHERE room_id = ? AND persona_id = ? AND revoked_at IS NULL')
    .run(nowIso(), roomId, targetUserId);
};

export const listBannedUsers = (roomId) => {
  return db.prepare(`
    SELECT rb.persona_id as id, p.alias, p.avatar, rb.created_at
    FROM room_bans rb
    JOIN personas p ON p.id = rb.persona_id
    WHERE rb.room_id = ? AND rb.revoked_at IS NULL
    ORDER BY rb.created_at DESC
  `).all(roomId);
};

export const deleteRoomByAdmin = ({ roomId, requesterId }) => {
  if (!isRoomAdmin({ roomId, personaId: requesterId })) throw new Error('Only admin can delete room');
  db.prepare('UPDATE rooms SET deleted_at = ? WHERE id = ?').run(nowIso(), roomId);
};
