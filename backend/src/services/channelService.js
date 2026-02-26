import { db, nowIso } from '../db/database.js';
import { listRooms } from './roomService.js';

const normalizeScope = (scope) => {
  const value = String(scope || 'nearby').toLowerCase();
  if (['nearby', 'bookmarked', 'recent'].includes(value)) return value;
  return 'nearby';
};

const getBookmarkedRoomIds = (personaId) => {
  if (!personaId) return new Set();
  const rows = db.prepare('SELECT room_id FROM channel_bookmarks WHERE persona_id = ?').all(personaId);
  return new Set(rows.map((row) => row.room_id));
};

const getRecentRoomMap = (personaId) => {
  if (!personaId) return new Map();
  const rows = db.prepare(`
    SELECT room_id, MAX(joined_at) AS recent_joined_at
    FROM room_memberships
    WHERE persona_id = ?
    GROUP BY room_id
  `).all(personaId);

  return rows.reduce((acc, row) => {
    acc.set(row.room_id, row.recent_joined_at);
    return acc;
  }, new Map());
};

export const listChannels = ({ personaId, scope, geohash, q }) => {
  const effectiveScope = normalizeScope(scope);
  const bookmarkIds = getBookmarkedRoomIds(personaId);
  const recentMap = getRecentRoomMap(personaId);

  let rooms = listRooms().map((room) => ({
    ...room,
    channelMeta: {
      ...(room.channelMeta || {}),
      channelKind: room.channelMeta?.channelKind || 'general',
      geohashPrefix: room.channelMeta?.geohashPrefix || null,
      regionLabel: room.channelMeta?.regionLabel || null,
      isBookmarked: bookmarkIds.has(room.id)
    }
  }));

  const cleanQuery = String(q || '').trim().toLowerCase();
  if (cleanQuery) {
    rooms = rooms.filter((room) => {
      const haystack = [room.name, room.rules, room.channelMeta.regionLabel, room.channelMeta.geohashPrefix]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(cleanQuery);
    });
  }

  const cleanGeohash = String(geohash || '').trim().toLowerCase();
  if (effectiveScope === 'nearby') {
    if (cleanGeohash) {
      rooms = rooms.filter((room) => {
        if (room.channelMeta.channelKind !== 'location') return false;
        return String(room.channelMeta.geohashPrefix || '').toLowerCase().startsWith(cleanGeohash);
      });
    } else {
      rooms = rooms.filter((room) => room.channelMeta.channelKind !== 'private');
    }

    rooms.sort((a, b) => Number(b.activeCount || 0) - Number(a.activeCount || 0));
  }

  if (effectiveScope === 'bookmarked') {
    rooms = rooms.filter((room) => room.channelMeta.isBookmarked);
    rooms.sort((a, b) => Number(b.activeCount || 0) - Number(a.activeCount || 0));
  }

  if (effectiveScope === 'recent') {
    rooms = rooms.filter((room) => recentMap.has(room.id) || room.channelMeta.isBookmarked);
    rooms.sort((a, b) => {
      const aTime = new Date(recentMap.get(a.id) || a.createdAt || 0).getTime();
      const bTime = new Date(recentMap.get(b.id) || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  return rooms;
};

export const addChannelBookmark = ({ personaId, roomId }) => {
  const now = nowIso();
  db.prepare(`
    INSERT INTO channel_bookmarks (persona_id, room_id, created_at)
    VALUES (?, ?, ?)
    ON CONFLICT(persona_id, room_id) DO NOTHING
  `).run(personaId, roomId, now);
};

export const removeChannelBookmark = ({ personaId, roomId }) => {
  db.prepare('DELETE FROM channel_bookmarks WHERE persona_id = ? AND room_id = ?').run(personaId, roomId);
};
