import express from 'express';
import { createSession, getMe, panicReset } from '../controllers/identityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/session', createSession);
router.get('/me', requireAuth, getMe);
router.post('/panic-reset', requireAuth, panicReset);

export default router;
