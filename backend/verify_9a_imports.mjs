// ═══════════════════════════════════════════════════════════════
//  LAYER 9A — BACKEND IMPORT & EXPORT VERIFICATION
// ═══════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;

const check = (label, condition) => {
    if (condition) { console.log(`  ✓ ${label}`); passed++; }
    else { console.error(`  ✗ ${label}`); failed++; }
};

// ── 1. monkeyService.js ─────────────────────────────────────────
console.log('\n[1] monkeyService.js');
try {
    const m = await import('./src/services/monkeyService.js');
    const req = [
        'analyzeMessage', 'enqueueJob', 'appendRoomHistory',
        'handleHook', 'handleWebhook',
        'startHeartbeat', 'stopHeartbeat', 'restartHeartbeat',
        'resetMonkeyMemory', 'getMonkeyBankBalance', 'topUpMonkeyBank'
    ];
    req.forEach(name => check(name, typeof m[name] === 'function'));
} catch (e) {
    console.error(`  ✗ LOAD FAILED: ${e.message}`);
    failed++;
}

// ── 2. monkeyScheduler.js ───────────────────────────────────────
console.log('\n[2] monkeyScheduler.js');
try {
    const m = await import('./src/services/monkeyScheduler.js');
    const req = [
        'registerCrons', 'unregisterCrons', 'reregisterCrons',
        'recoverCronsOnStartup', 'getCronStats'
    ];
    req.forEach(name => check(name, typeof m[name] === 'function'));
} catch (e) {
    console.error(`  ✗ LOAD FAILED: ${e.message}`);
    failed++;
}

// ── 3. webhookController.js ─────────────────────────────────────
console.log('\n[3] webhookController.js');
try {
    const m = await import('./src/controllers/webhookController.js');
    const req = [
        'handleWebhookPost', 'pingWebhook',
        'rotateWebhookSecret', 'backfillWebhookSecrets'
    ];
    req.forEach(name => check(name, typeof m[name] === 'function'));
} catch (e) {
    console.error(`  ✗ LOAD FAILED: ${e.message}`);
    failed++;
}

// ── 4. webhookRoutes.js ─────────────────────────────────────────
console.log('\n[4] webhookRoutes.js');
try {
    const m = await import('./src/routes/webhookRoutes.js');
    check('createWebhookRoutes', typeof m.createWebhookRoutes === 'function');
} catch (e) {
    console.error(`  ✗ LOAD FAILED: ${e.message}`);
    failed++;
}

// ── 5. socketHandler.js (named export, not default) ─────────────
console.log('\n[5] socketHandler.js');
try {
    const m = await import('./src/socket/socketHandler.js');
    check('configureSocket (named export)', typeof m.configureSocket === 'function');
} catch (e) {
    console.error(`  ✗ LOAD FAILED: ${e.message}`);
    failed++;
}

// ── 6. app.js ───────────────────────────────────────────────────
console.log('\n[6] app.js');
try {
    await import('./src/app.js');
    check('app.js boots without crash', true);
} catch (e) {
    console.error(`  ✗ LOAD FAILED: ${e.message}`);
    failed++;
}

// ── SUMMARY ─────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log(`  LAYER 9A RESULT: ${passed} passed, ${failed} failed`);
console.log(failed === 0 ? '  ✅ ALL IMPORTS OK' : '  ❌ FAILURES DETECTED — fix before proceeding');
console.log('═══════════════════════════════════════\n');
process.exit(failed > 0 ? 1 : 0);
