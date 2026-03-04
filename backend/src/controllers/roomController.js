import { listRooms, createRoom, getRoomById, updateRoomSettings, getRecentMessages } from '../services/roomService.js';
import { listNotifications } from '../services/notificationService.js';

export const getRooms = (req, res) => {
  return res.json({ success: true, data: listRooms() });
};

export const postRoom = (req, res) => {
  try {
    const room = createRoom({
      personaId: req.persona.id,
      name: req.body?.name,
      type: req.body?.type,
      rulesText: req.body?.rulesText,
      settings: req.body?.settings || {},
      channelMeta: req.body?.channelMeta || {}
    });

    return res.status(201).json({ success: true, data: room });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getRoom = (req, res) => {
  const room = getRoomById(req.params.roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  return res.json({ success: true, data: room });
};

export const patchRoomSettings = (req, res) => {
  try {
    const room = updateRoomSettings({
      roomId: req.params.roomId,
      personaId: req.persona.id,
      patch: req.body || {}
    });

    return res.json({ success: true, data: room });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getRoomNotifications = (req, res) => {
  const notifications = listNotifications({
    personaId: req.persona.id,
    roomId: req.params.roomId,
    limit: Number(req.query.limit || 50)
  });

  return res.json({ success: true, data: notifications });
};

export const getRoomPreview = (req, res) => {
  const messages = getRecentMessages(req.params.roomId, 50);
  // Return last 3 text messages only (no images or system msgs)
  const preview = messages
    .filter(m => m.text && m.type === 'user')
    .slice(-3)
    .map(m => ({ sender: m.sender.name, text: m.text }));
  return res.json({ success: true, data: preview });
};
