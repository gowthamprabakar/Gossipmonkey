// ═══════════════════════════════════════════════════════════════
//  LAYER 9B — DATABASE INTEGRITY VERIFICATION
// ═══════════════════════════════════════════════════════════════

import { db } from './src/db/database.js';
import { getRoomById } from './src/services/roomService.js';
import { DEFAULT_MONKEY_CONFIG } from './src/services/roomService.js';

let passed = 0;
let failed = 0;

const check = (label, condition, detail = '') => {
    if (condition) { console.log(`  ✓ ${label}${detail ? ' — ' + detail : ''}`); passed++; }
    else { console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
};

// ── 1. Required Tables ──────────────────────────────────────────
console.log('\n[1] Required Tables');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(t => t.name);
const required = ['rooms', 'room_settings', 'messages', 'personas', 'monkey_memory', 'sessions', 'room_bans'];
required.forEach(t => check(t, tables.includes(t)));
console.log('  All tables:', tables.join(', '));

// ── 2. monkey-ai-admin Seed Persona ────────────────────────────
console.log('\n[2] Seed Persona');
const adminPersona = db.prepare("SELECT id, alias FROM personas WHERE id = 'monkey-ai-admin'").get();
check('monkey-ai-admin exists', !!adminPersona, adminPersona ? `alias="${adminPersona.alias}"` : 'NOT FOUND');

// ── 3. Webhook Secrets on All Rooms ────────────────────────────
console.log('\n[3] Webhook Secrets');
const allSettings = db.prepare('SELECT room_id, monkey_config_json FROM room_settings').all();
let hasSecret = 0, noSecret = 0;
allSettings.forEach(r => {
    const cfg = JSON.parse(r.monkey_config_json || '{}');
    cfg.webhookSecret ? hasSecret++ : noSecret++;
});
check(`All ${allSettings.length} rooms have webhookSecret`, noSecret === 0, `${hasSecret} with secret, ${noSecret} missing`);

// ── 4. monkey_memory Table Readable ────────────────────────────
console.log('\n[4] monkey_memory Table');
try {
    const memRows = db.prepare('SELECT COUNT(*) as c FROM monkey_memory').get();
    check('monkey_memory readable', true, `${memRows.c} rows`);
} catch (e) {
    check('monkey_memory readable', false, e.message);
}

// ── 5. DEFAULT_MONKEY_CONFIG Merge (parseMonkeyConfig) ─────────
console.log('\n[5] DEFAULT_MONKEY_CONFIG Merge');
const spotFields = ['name', 'personality', 'heartbeatEnabled', 'heartbeatIntervalMinutes', 'hooksEnabled', 'monkeyBankBalance', 'monkeyBankDailyReset', 'webhookRateLimitPerMinute', 'aiRewardAmount', 'crons'];
const sampleRooms = db.prepare('SELECT id FROM rooms LIMIT 3').all();
if (sampleRooms.length === 0) {
    console.log('  ⚠ No rooms in DB to test merge');
} else {
    sampleRooms.forEach((row, idx) => {
        const room = getRoomById(row.id);
        const mc = room?.monkeyConfig;
        const missing = spotFields.filter(f => mc?.[f] === undefined);
        check(`Room ${idx + 1} (${row.id.slice(0, 8)}) — all fields merged`, missing.length === 0,
            missing.length > 0 ? `MISSING: ${missing.join(', ')}` : `${spotFields.length} fields OK`);
    });
}

// ── 6. DEFAULT_MONKEY_CONFIG Has All Required Keys ──────────────
console.log('\n[6] DEFAULT_MONKEY_CONFIG Keys');
const defaultKeys = Object.keys(DEFAULT_MONKEY_CONFIG);
const minRequired = ['name', 'personality', 'triggerWords', 'replyFrequency', 'heartbeatEnabled', 'heartbeatIntervalMinutes', 'hooksEnabled', 'crons', 'webhookSecret', 'webhookRateLimitPerMinute', 'monkeyBankBalance', 'monkeyBankDailyReset', 'aiRewardAmount', 'maxDailyRewardPerUser'];
minRequired.forEach(k => check(`DEFAULT has "${k}"`, defaultKeys.includes(k)));

// ── 7. No Orphaned Rooms ────────────────────────────────────────
console.log('\n[7] No Orphaned Rooms');
const orphaned = db.prepare(`
  SELECT r.id FROM rooms r
  LEFT JOIN room_settings rs ON rs.room_id = r.id
  WHERE rs.room_id IS NULL AND r.deleted_at IS NULL
`).all();
check('No orphaned rooms (rooms without room_settings)', orphaned.length === 0, `${orphaned.length} orphaned`);
if (orphaned.length > 0) {
    orphaned.forEach(r => console.error(`    orphan: ${r.id}`));
}

// ── 8. hooksEnabled Shape in DEFAULT_MONKEY_CONFIG ─────────────
console.log('\n[8] hooksEnabled Shape');
const hooks = DEFAULT_MONKEY_CONFIG.hooksEnabled;
const expectedHooks = ['user_joined', 'user_left', 'user_kicked', 'user_banned', 'room_locked', 'room_unlocked', 'room_muted', 'room_unmuted', 'paint_triggered', 'image_shared'];
expectedHooks.forEach(h => check(`hooksEnabled.${h} defined`, h in hooks, `default: ${hooks[h]}`));

// ── SUMMARY ─────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log(`  LAYER 9B RESULT: ${passed} passed, ${failed} failed`);
console.log(failed === 0 ? '  ✅ DATABASE INTEGRITY OK' : '  ❌ ISSUES FOUND — fix before proceeding');
console.log('═══════════════════════════════════════\n');
process.exit(failed > 0 ? 1 : 0);
