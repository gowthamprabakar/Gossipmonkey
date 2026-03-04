import express from 'express';
import { getRooms, postRoom, getRoom, patchRoomSettings, getRoomNotifications, getRoomPreview } from '../controllers/roomController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getRooms);
router.get('/:roomId', getRoom);
router.get('/:roomId/preview', getRoomPreview);   // public: last 3 msgs for card preview
router.post('/', requireAuth, postRoom);
router.patch('/:roomId/settings', requireAuth, patchRoomSettings);
router.get('/:roomId/notifications', requireAuth, getRoomNotifications);

export default router;
