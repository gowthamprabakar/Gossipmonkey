import { authFromHeader } from '../services/authService.js';
import { getRoomById } from '../services/roomService.js';
import { addChannelBookmark, listChannels, removeChannelBookmark } from '../services/channelService.js';

export const getChannels = (req, res) => {
  const persona = authFromHeader(req.headers.authorization || '');
  const channels = listChannels({
    personaId: persona?.id || null,
    scope: req.query.scope,
    geohash: req.query.geohash,
    q: req.query.q
  });

  return res.json({ success: true, data: channels });
};

export const postBookmark = (req, res) => {
  const roomId = req.params.roomId;
  const room = getRoomById(roomId);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Channel not found' });
  }

  addChannelBookmark({ personaId: req.persona.id, roomId });
  return res.status(201).json({ success: true, data: { roomId, bookmarked: true } });
};

export const deleteBookmark = (req, res) => {
  const roomId = req.params.roomId;
  removeChannelBookmark({ personaId: req.persona.id, roomId });
  return res.json({ success: true, data: { roomId, bookmarked: false } });
};
