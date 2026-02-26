import express from 'express';
import { getPrivacyMe, patchPrivacyMe } from '../controllers/privacyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', requireAuth, getPrivacyMe);
router.patch('/me', requireAuth, patchPrivacyMe);

export default router;
