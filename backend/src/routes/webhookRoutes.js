import express from 'express';
import {
    handleWebhookPost,
    pingWebhook,
    rotateWebhookSecret
} from '../controllers/webhookController.js';

/**
 * Factory that builds the webhook router with io injected.
 * Routes:
 *   GET  /api/rooms/:roomId/webhook         — ping / auth test
 *   POST /api/rooms/:roomId/webhook         — trigger Monkey
 *   POST /api/rooms/:roomId/webhook/rotate  — rotate secret (admin)
 */
export const createWebhookRoutes = (io) => {
    const router = express.Router();

    // Connectivity test (no queue, no Ollama call)
    router.get('/rooms/:roomId/webhook', pingWebhook);

    // Main trigger
    router.post('/rooms/:roomId/webhook', handleWebhookPost(io));

    // Secret rotation
    router.post('/rooms/:roomId/webhook/rotate', rotateWebhookSecret);

    return router;
};
