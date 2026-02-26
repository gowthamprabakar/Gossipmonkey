import express from 'express';
import { deleteBookmark, getChannels, postBookmark } from '../controllers/channelController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getChannels);
router.post('/:roomId/bookmark', requireAuth, postBookmark);
router.delete('/:roomId/bookmark', requireAuth, deleteBookmark);

export default router;
