import cron from 'node-cron';
import { enqueueJob, handleWebhook } from './monkeyService.js';
import { db, nowIso } from '../db/database.js';

// ── Cron Registry: Map<roomId, { id, task }[]> ────────────────────────────────
const cronRegistry = new Map();

// ═══════════════════════════════════════════════════════════════════════════════
//  INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Read the latest monkeyConfig from DB — avoids stale closure problem.
 * FIX: every cron tick reads fresh config instead of using captured closure.
 */
const _getFreshConfig = (roomId) => {
    try {
        const row = db.prepare('SELECT monkey_config_json FROM room_settings WHERE room_id = ?').get(roomId);
        if (!row) return null;
        return JSON.parse(row.monkey_config_json || '{}');
    } catch {
        return null;
    }
};

/**
 * Update lastFiredAt for a specific cron by id and write back to DB.
 * FIX: cron runs now record the exact ISO timestamp they fired.
 */
const _updateLastFiredAt = (roomId, cronId) => {
    try {
        const row = db.prepare('SELECT monkey_config_json FROM room_settings WHERE room_id = ?').get(roomId);
        if (!row) return;
        const config = JSON.parse(row.monkey_config_json || '{}');
        if (!Array.isArray(config.crons)) return;
        config.crons = config.crons.map(c =>
            c.id === cronId ? { ...c, lastFiredAt: nowIso() } : c
        );
        db.prepare('UPDATE room_settings SET monkey_config_json = ? WHERE room_id = ?')
            .run(JSON.stringify(config), roomId);
    } catch (err) {
        console.error(`[Scheduler] Failed to update lastFiredAt for cron ${cronId}:`, err.message);
    }
};

/**
 * Execute a single cron task:
 *   1. Re-reads fresh monkeyConfig from DB (not stale closure)
 *   2. Validates the cron is still enabled
 *   3. Updates lastFiredAt
 *   4. Delegates to handleWebhook with a synthetic 'cron' payload
 */
const _runCronJob = async (io, roomId, cronId, cronName, cronInstruction) => {
    // FIX: fresh config read — no stale closure
    const monkeyConfig = _getFreshConfig(roomId);
    if (!monkeyConfig) return;

    // If cron was disabled since registration, skip silently
    const cronDef = Array.isArray(monkeyConfig.crons)
        ? monkeyConfig.crons.find(c => c.id === cronId)
        : null;

    if (!cronDef?.enabled) {
        console.log(`[Scheduler] Cron "${cronName}" (${cronId}) is disabled — skipping`);
        return;
    }

    console.log(`[Scheduler][${roomId}] Cron "${cronName}" fired`);

    // Record fire time
    _updateLastFiredAt(roomId, cronId);

    // Delegate to the webhook handler with a synthetic cron payload
    await handleWebhook(io, roomId, {
        type: 'cron',
        title: cronName || 'Scheduled Task',
        payload: {
            instruction: cronInstruction,
            scheduleName: cronName,
            firesAt: nowIso()
        }
    }, monkeyConfig);
};

/**
 * Reset the monkey bank to its daily reset amount.
 * FIX: reads fresh DB config — does NOT use stale closure value.
 */
const _resetMonkeyBank = (roomId) => {
    try {
        const row = db.prepare('SELECT monkey_config_json FROM room_settings WHERE room_id = ?').get(roomId);
        if (!row) return;
        const config = JSON.parse(row.monkey_config_json || '{}');
        const resetAmount = Number(config.monkeyBankDailyReset ?? 50);
        config.monkeyBankBalance = resetAmount;
        db.prepare('UPDATE room_settings SET monkey_config_json = ? WHERE room_id = ?')
            .run(JSON.stringify(config), roomId);
        console.log(`[Scheduler][${roomId}] Bank reset to ${resetAmount} 🍌`);
    } catch (err) {
        console.error(`[Scheduler] Failed to reset monkey bank for ${roomId}:`, err.message);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register all enabled crons for a room plus the daily bank reset.
 * FIX: only captures roomId + primitive values (id, name, instruction) in closures —
 * no monkeyConfig object reference captured.
 */
export const registerCrons = (io, roomId, monkeyConfig) => {
    const crons = monkeyConfig?.crons;
    if (!Array.isArray(crons) || !crons.length) {
        // Still register bank reset even with no custom crons
        _registerBankReset(roomId);
        return;
    }

    // Clear any existing jobs first
    unregisterCrons(roomId);

    const tasks = [];

    for (const cronConfig of crons) {
        if (!cronConfig.enabled) continue;

        if (!cronConfig.schedule || !cron.validate(cronConfig.schedule)) {
            console.warn(`[Scheduler][${roomId}] Invalid schedule "${cronConfig.schedule}" for cron "${cronConfig.name}" — skipping`);
            continue;
        }

        // FIX: capture only primitive values (id, name, instruction) — NOT the config object
        const { id: cronId, name: cronName, instruction: cronInstruction, schedule } = cronConfig;

        const task = cron.schedule(schedule, () => {
            console.log(`[Scheduler][${roomId}] Cron "${cronName}" tick — enqueueing job`);
            enqueueJob(roomId, {
                type: 'cron',
                execute: () => _runCronJob(io, roomId, cronId, cronName, cronInstruction)
            });
        }, {
            scheduled: true,
            timezone: 'UTC'
        });

        tasks.push({ id: cronId, task });
        console.log(`[Scheduler][${roomId}] Registered cron "${cronName}" (${schedule})`);
    }

    // Always add daily bank reset at UTC midnight
    const bankReset = cron.schedule('0 0 * * *', () => {
        _resetMonkeyBank(roomId);
    }, { scheduled: true, timezone: 'UTC' });

    tasks.push({ id: '__bank_reset__', task: bankReset });
    cronRegistry.set(roomId, tasks);
    console.log(`[Scheduler][${roomId}] ${tasks.length - 1} cron(s) registered + bank reset`);
};

/** Register only the bank reset cron (no custom crons for this room) */
const _registerBankReset = (roomId) => {
    const existing = cronRegistry.get(roomId) || [];
    const alreadyHasReset = existing.some(t => t.id === '__bank_reset__');
    if (alreadyHasReset) return;

    const bankReset = cron.schedule('0 0 * * *', () => {
        _resetMonkeyBank(roomId);
    }, { scheduled: true, timezone: 'UTC' });

    existing.push({ id: '__bank_reset__', task: bankReset });
    cronRegistry.set(roomId, existing);
    console.log(`[Scheduler][${roomId}] Bank reset cron registered`);
};

/**
 * Unregister and DESTROY all cron jobs for a room.
 * FIX: uses task.stop() + task.destroy() to free memory properly.
 */
export const unregisterCrons = (roomId) => {
    const tasks = cronRegistry.get(roomId) || [];
    tasks.forEach(({ id, task }) => {
        try {
            task.stop();
            if (typeof task.destroy === 'function') task.destroy();
        } catch (err) {
            console.warn(`[Scheduler][${roomId}] Error stopping cron task ${id}:`, err.message);
        }
    });
    cronRegistry.delete(roomId);
    if (tasks.length) {
        console.log(`[Scheduler][${roomId}] Unregistered ${tasks.length} cron task(s)`);
    }
};

/**
 * Re-register crons after settings update.
 */
export const reregisterCrons = (io, roomId, newMonkeyConfig) => {
    unregisterCrons(roomId);
    registerCrons(io, roomId, newMonkeyConfig);
};

/**
 * Server-restart recovery: re-register crons for all rooms that currently have
 * active participants. Called once at server startup from app.js.
 *
 * FIX: rooms with users present at server restart now get their crons back
 * without needing a user to leave and rejoin.
 */
export const recoverCronsOnStartup = (io) => {
    try {
        // Find all rooms that have at least one active member
        const activeRooms = db.prepare(
            `SELECT DISTINCT rm.room_id, rs.monkey_config_json
       FROM room_memberships rm
       JOIN room_settings rs ON rs.room_id = rm.room_id
       JOIN rooms r ON r.id = rm.room_id
       WHERE rm.left_at IS NULL
         AND r.deleted_at IS NULL`
        ).all();

        if (!activeRooms.length) return;

        let recovered = 0;
        for (const { room_id, monkey_config_json } of activeRooms) {
            try {
                const monkeyConfig = JSON.parse(monkey_config_json || '{}');
                registerCrons(io, room_id, monkeyConfig);
                recovered++;
            } catch (err) {
                console.warn(`[Scheduler] Failed to recover crons for room ${room_id}:`, err.message);
            }
        }
        console.log(`[Scheduler] Startup recovery: registered crons for ${recovered} room(s)`);
    } catch (err) {
        console.error('[Scheduler] Startup recovery failed:', err.message);
    }
};

/**
 * Diagnostic helper: returns the number of running cron tasks across all rooms.
 */
export const getCronStats = () => {
    const stats = {};
    for (const [roomId, tasks] of cronRegistry.entries()) {
        stats[roomId] = tasks.map(t => t.id);
    }
    return stats;
};
