import crypto from 'crypto';
import { db } from '../db/database.js';
import { getRoomById } from '../services/roomService.js';
import { enqueueJob, handleWebhook } from '../services/monkeyService.js';

// ── Per-room webhook rate limiter: Map<roomId, { count, windowStart }> ─────────
const webhookRateLimiter = new Map();

const _checkRateLimit = (roomId, limitPerMinute) => {
    const now = Date.now();
    const tracker = webhookRateLimiter.get(roomId) || { count: 0, windowStart: now };
    if (now - tracker.windowStart > 60_000) {
        webhookRateLimiter.set(roomId, { count: 1, windowStart: now });
        return true;
    }
    if (tracker.count >= limitPerMinute) return false;
    tracker.count += 1;
    webhookRateLimiter.set(roomId, tracker);
    return true;
};

/**
 * FIX: Timing-safe secret comparison using crypto.timingSafeEqual.
 * Plain === comparison leaks timing info that lets attackers enumerate valid secrets.
 */
const _secretsMatch = (a, b) => {
    if (!a || !b) return false;
    try {
        const bufA = Buffer.from(String(a));
        const bufB = Buffer.from(String(b));
        if (bufA.length !== bufB.length) return false;
        return crypto.timingSafeEqual(bufA, bufB);
    } catch {
        return false;
    }
};

/**
 * Re-read room + fresh monkeyConfig from DB inside the job closure.
 * FIX: avoids stale closure — monkeyConfig is always fresh when the job actually executes.
 */
const _executeFreshWebhookJob = async (io, roomId, webhookData) => {
    try {
        const row = db.prepare('SELECT monkey_config_json FROM room_settings WHERE room_id = ?').get(roomId);
        if (!row) return;
        const monkeyConfig = JSON.parse(row.monkey_config_json || '{}');
        await handleWebhook(io, roomId, webhookData, monkeyConfig);
    } catch (err) {
        console.error(`[Webhook][${roomId}] Job execution error:`, err.message);
    }
};

// ── Sanitise and truncate incoming webhook payload fields ──────────────────────
const _sanitise = (val, maxLen = 200) =>
    String(val || '').replace(/<[^>]*>/g, '').trim().slice(0, maxLen);

const _sanitisePayload = (payload) => {
    if (typeof payload !== 'object' || payload === null) return {};
    // Flatten to string values only — strip any nested objects or functions
    const safe = {};
    for (const [k, v] of Object.entries(payload)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            safe[_sanitise(k, 50)] = _sanitise(String(v), 300);
        }
    }
    return safe;
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/rooms/:roomId/webhook — ping / connectivity test
//  External systems can use this to verify their secret is correct without
//  triggering an actual AI response.
// ─────────────────────────────────────────────────────────────────────────────
export const pingWebhook = (req, res) => {
    const { roomId } = req.params;
    const authHeader = req.headers.authorization || '';
    const secret = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!secret) return res.status(401).json({ ok: false, error: 'Missing Authorization header.' });

    const room = getRoomById(roomId);
    if (!room) return res.status(404).json({ ok: false, error: 'Room not found.' });

    // FIX: check deleted rooms
    const rawRoom = db.prepare('SELECT deleted_at FROM rooms WHERE id = ?').get(roomId);
    if (rawRoom?.deleted_at) return res.status(410).json({ ok: false, error: 'Room deleted.' });

    const storedSecret = room?.monkeyConfig?.webhookSecret;

    // FIX: timing-safe comparison
    if (!_secretsMatch(storedSecret, secret)) {
        return res.status(401).json({ ok: false, error: 'Invalid secret.' });
    }

    return res.json({
        ok: true,
        roomId,
        message: 'Webhook auth verified. POST to this URL to trigger the Monkey.',
        rateLimit: `${Number(room.monkeyConfig?.webhookRateLimitPerMinute || 10)} requests/minute`
    });
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/rooms/:roomId/webhook — trigger the Monkey via external system
// ─────────────────────────────────────────────────────────────────────────────
export const handleWebhookPost = (io) => async (req, res) => {
    const { roomId } = req.params;
    const authHeader = req.headers.authorization || '';
    const secret = authHeader.replace(/^Bearer\s+/i, '').trim();

    // Must have auth header
    if (!secret) {
        return res.status(401).json({ ok: false, error: 'Missing Authorization: Bearer {secret} header.' });
    }

    // Room must exist
    const room = getRoomById(roomId);
    if (!room) return res.status(404).json({ ok: false, error: 'Room not found.' });

    // FIX: check room is not deleted
    const rawRoom = db.prepare('SELECT deleted_at FROM rooms WHERE id = ?').get(roomId);
    if (rawRoom?.deleted_at) {
        return res.status(410).json({ ok: false, error: 'Room has been deleted.' });
    }

    // FIX: timing-safe secret comparison
    const storedSecret = room?.monkeyConfig?.webhookSecret;
    if (!_secretsMatch(storedSecret, secret)) {
        console.warn(`[Webhook][${roomId}] Invalid secret attempt from ${req.ip}`);
        return res.status(401).json({ ok: false, error: 'Invalid webhook secret.' });
    }

    // Rate limit
    const rateLimit = Number(room.monkeyConfig?.webhookRateLimitPerMinute || 10);
    if (!_checkRateLimit(roomId, rateLimit)) {
        return res.status(429).json({
            ok: false,
            error: `Rate limit exceeded. Max ${rateLimit} requests/minute for this room.`,
            retryAfterSeconds: 60
        });
    }

    // FIX: sanitise incoming payload
    const type = _sanitise(req.body?.type || 'raw', 50);
    const title = _sanitise(req.body?.title || '', 100);
    const payload = _sanitisePayload(req.body?.payload);

    const webhookData = { type, title, payload };

    // FIX: enqueue with fresh DB read inside execute closure (no stale config)
    enqueueJob(roomId, {
        type: 'webhook',
        execute: () => _executeFreshWebhookJob(io, roomId, webhookData)
    });

    console.log(`[Webhook][${roomId}] Queued "${type}" from ${req.ip}`);

    return res.status(202).json({
        ok: true,
        queued: true,
        roomId,
        type,
        message: 'Queued — Monkey will respond shortly'
    });
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/rooms/:roomId/webhook/rotate — rotate webhook secret (admin only)
//  Called from frontend when admin clicks "Regenerate Secret"
// ─────────────────────────────────────────────────────────────────────────────
export const rotateWebhookSecret = (req, res) => {
    const { roomId } = req.params;

    // Must be authenticated as room admin via session token
    const { personaId } = req.body || {};
    if (!personaId) return res.status(400).json({ ok: false, error: 'personaId required.' });

    try {
        const rawRoom = db.prepare('SELECT creator_id, deleted_at FROM rooms WHERE id = ?').get(roomId);
        if (!rawRoom || rawRoom.deleted_at) return res.status(404).json({ ok: false, error: 'Room not found.' });
        if (rawRoom.creator_id !== personaId) return res.status(403).json({ ok: false, error: 'Only the room admin can rotate the secret.' });

        const row = db.prepare('SELECT monkey_config_json FROM room_settings WHERE room_id = ?').get(roomId);
        const config = JSON.parse(row?.monkey_config_json || '{}');
        const newSecret = crypto.randomBytes(32).toString('hex');
        config.webhookSecret = newSecret;

        db.prepare('UPDATE room_settings SET monkey_config_json = ? WHERE room_id = ?')
            .run(JSON.stringify(config), roomId);

        console.log(`[Webhook][${roomId}] Secret rotated by ${personaId}`);
        return res.json({ ok: true, webhookSecret: newSecret, message: 'Secret rotated. Update your external systems.' });
    } catch (err) {
        console.error(`[Webhook] rotate error:`, err.message);
        return res.status(500).json({ ok: false, error: 'Internal error.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Backfill: ensure rooms created before webhook secret generation have a secret
//  Called once at startup from app.js
// ─────────────────────────────────────────────────────────────────────────────
export const backfillWebhookSecrets = () => {
    try {
        const rows = db.prepare(
            `SELECT room_id, monkey_config_json FROM room_settings`
        ).all();

        let patched = 0;
        for (const { room_id, monkey_config_json } of rows) {
            const config = JSON.parse(monkey_config_json || '{}');
            if (!config.webhookSecret) {
                config.webhookSecret = crypto.randomBytes(32).toString('hex');
                db.prepare('UPDATE room_settings SET monkey_config_json = ? WHERE room_id = ?')
                    .run(JSON.stringify(config), room_id);
                patched++;
            }
        }
        if (patched > 0) {
            console.log(`[Webhook] Backfilled webhook secrets for ${patched} room(s)`);
        }
    } catch (err) {
        console.error('[Webhook] Backfill error:', err.message);
    }
};
