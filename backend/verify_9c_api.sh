#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  LAYER 9C — REST API VERIFICATION (curl tests)
# ═══════════════════════════════════════════════════════════════

ROOM_ID="global"
SECRET="787addb1d8888469ce927b828ed68033b66ac84d322c256ffff3675b0fa9eeb7"
BASE="http://localhost:3000"
PASSED=0
FAILED=0

check() {
  local label="$1"
  local condition="$2"
  local detail="$3"
  if [ "$condition" = "true" ]; then
    echo "  ✓ $label${detail:+ — $detail}"
    PASSED=$((PASSED + 1))
  else
    echo "  ✗ $label${detail:+ — $detail}" >&2
    FAILED=$((FAILED + 1))
  fi
}

# ── Test 9C-1: Cron Stats Endpoint ─────────────────────────────
echo ""
echo "[9C-1] GET /api/monkey/crons/stats"
BODY=$(curl -s "$BASE/api/monkey/crons/stats")
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/monkey/crons/stats")
echo "  Response: $BODY" | head -c 200
echo ""
check "HTTP 200" "$([ "$CODE" = "200" ] && echo true || echo false)" "HTTP $CODE"
check "Response is JSON object" "$(echo "$BODY" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("true" if isinstance(d,dict) else "false")' 2>/dev/null || echo false)"

# ── Test 9C-2: Webhook Ping — Correct Secret ───────────────────
echo ""
echo "[9C-2] GET /api/rooms/:roomId/webhook (correct secret)"
BODY=$(curl -s "$BASE/api/rooms/$ROOM_ID/webhook" -H "Authorization: Bearer $SECRET")
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/rooms/$ROOM_ID/webhook" -H "Authorization: Bearer $SECRET")
echo "  Response: $BODY"
check "HTTP 200" "$([ "$CODE" = "200" ] && echo true || echo false)" "HTTP $CODE"
check "ok:true in response" "$(echo "$BODY" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("true" if d.get("ok") else "false")' 2>/dev/null || echo false)"

# ── Test 9C-3: Webhook Ping — Wrong Secret ─────────────────────
echo ""
echo "[9C-3] GET /api/rooms/:roomId/webhook (WRONG secret)"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/rooms/$ROOM_ID/webhook" -H "Authorization: Bearer WRONG_SECRET_XYZ")
echo "  HTTP Code: $CODE"
check "HTTP 401 on bad secret" "$([ "$CODE" = "401" ] && echo true || echo false)" "HTTP $CODE"

# ── Test 9C-4: Webhook Trigger — Valid Payload ─────────────────
echo ""
echo "[9C-4] POST /api/rooms/:roomId/webhook (valid payload)"
BODY=$(curl -s -X POST "$BASE/api/rooms/$ROOM_ID/webhook" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"news","title":"Verification test","payload":{"source":"TestSuite9C"}}')
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/rooms/$ROOM_ID/webhook" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"news","title":"Verification test","payload":{"source":"TestSuite9C"}}')
echo "  Response: $BODY"
check "HTTP 202 Accepted" "$([ "$CODE" = "202" ] && echo true || echo false)" "HTTP $CODE"
check "queued:true in response" "$(echo "$BODY" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("true" if d.get("queued") else "false")' 2>/dev/null || echo false)"

# ── Test 9C-5: Webhook Trigger — No Auth Header ────────────────
echo ""
echo "[9C-5] POST /api/rooms/:roomId/webhook (no auth)"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/rooms/$ROOM_ID/webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"test","title":"no auth test"}')
echo "  HTTP Code: $CODE"
check "HTTP 401 without auth" "$([ "$CODE" = "401" ] && echo true || echo false)" "HTTP $CODE"

# ── Test 9C-6: Webhook Trigger — Deleted Room ──────────────────
echo ""
echo "[9C-6] GET /api/rooms/NONEXISTENT/webhook (room not found)"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/rooms/NONEXISTENT_ROOM_XYZ/webhook" \
  -H "Authorization: Bearer $SECRET")
echo "  HTTP Code: $CODE"
check "HTTP 401 or 404/410 on unknown room" "$([ "$CODE" = "401" ] || [ "$CODE" = "404" ] || [ "$CODE" = "410" ] && echo true || echo false)" "HTTP $CODE"

# ── SUMMARY ────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
echo "  LAYER 9C RESULT: $PASSED passed, $FAILED failed"
if [ "$FAILED" = "0" ]; then
  echo "  ✅ ALL REST API TESTS PASSED"
else
  echo "  ❌ FAILURES DETECTED — fix before proceeding"
fi
echo "═══════════════════════════════════════"
echo ""
exit $FAILED
