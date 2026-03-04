import express from 'express';
import {
    createSession, loginWithCode, getMe, patchMe, panicReset,
    listSessions, terminateSession, terminateAllSessions,
} from '../controllers/identityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — no auth required
router.post('/session', createSession);   // new account (alias + avatar + password)
router.post('/login', loginWithCode);     // returning user (code + password)

// Authenticated
router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, patchMe);
router.post('/panic-reset', requireAuth, panicReset);

// Session management
router.get('/sessions', requireAuth, listSessions);
router.delete('/sessions', requireAuth, terminateAllSessions);
router.delete('/sessions/:id', requireAuth, terminateSession);

export default router;
