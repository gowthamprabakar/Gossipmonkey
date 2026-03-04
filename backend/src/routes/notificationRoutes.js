import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { listNotifications } from '../services/notificationService.js';
import { db, nowIso } from '../db/database.js';

const router = express.Router();

// GET /api/notifications — all notifications for the authenticated persona
router.get('/', requireAuth, (req, res) => {
    const notifications = listNotifications({
        personaId: req.persona.id,
        limit: Number(req.query.limit || 50),
    });
    return res.json({ success: true, data: notifications });
});

// PATCH /api/notifications/:id/read — mark a notification as read
router.patch('/:id/read', requireAuth, (req, res) => {
    db.prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND persona_id = ?')
        .run(nowIso(), req.params.id, req.persona.id);
    return res.json({ success: true });
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', requireAuth, (req, res) => {
    db.prepare('UPDATE notifications SET read_at = ? WHERE persona_id = ? AND read_at IS NULL')
        .run(nowIso(), req.persona.id);
    return res.json({ success: true });
});

export default router;
