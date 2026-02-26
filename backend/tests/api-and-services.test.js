import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

const TEST_DB_PATH = `/tmp/chatmonkey-test-${process.pid}-${Date.now()}.db`;
process.env.DB_PATH = TEST_DB_PATH;
process.env.SESSION_SECRET = 'test-secret';

const { resetDatabaseForTests } = await import('../src/db/database.js');
const { upsertPersona, getPersonaById } = await import('../src/services/identityService.js');
const { createSessionToken, verifySessionToken, revokeSessionToken } = await import('../src/services/authService.js');
const {
  createRoom,
  updateRoomSettings,
  canSendMessage,
  createMessage,
  toggleReaction,
  kickUser,
  ensureRoomJoinAllowed,
  unbanUser,
  isRoomAdmin
} = await import('../src/services/roomService.js');
const { listChannels, addChannelBookmark, removeChannelBookmark } = await import('../src/services/channelService.js');
const { getPrivacyPreferences, updatePrivacyPreferences } = await import('../src/services/privacyService.js');
const { analyzeMessage } = await import('../src/services/monkeyService.js');

test.beforeEach(() => {
  resetDatabaseForTests();
});

test.after(() => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

test('session token creation and verification', () => {
  const persona = upsertPersona({ alias: 'Alpha Monkey', avatar: 'https://avatar/a' });
  const token = createSessionToken(persona.id);
  const verified = verifySessionToken(token);

  assert.ok(token);
  assert.equal(verified.id, persona.id);
  assert.equal(verified.alias, 'Alpha Monkey');
});

test('room settings update is admin-only', () => {
  const owner = upsertPersona({ alias: 'Owner', avatar: 'https://avatar/o' });
  const other = upsertPersona({ alias: 'Other', avatar: 'https://avatar/x' });

  const room = createRoom({
    personaId: owner.id,
    name: 'Secure Room',
    type: 'public',
    rulesText: 'Be kind',
    settings: {}
  });

  assert.equal(isRoomAdmin({ roomId: room.id, personaId: owner.id }), true);
  assert.equal(isRoomAdmin({ roomId: room.id, personaId: other.id }), false);

  assert.throws(() => {
    updateRoomSettings({ roomId: room.id, personaId: other.id, patch: { muteAll: true } });
  }, /Only room admin/);

  const updated = updateRoomSettings({ roomId: room.id, personaId: owner.id, patch: { muteAll: true, slowModeSeconds: 4 } });
  assert.equal(updated.settings.muteAll, true);
  assert.equal(updated.settings.slowModeSeconds, 4);
});

test('slow mode enforcement and reaction reward increment', () => {
  const owner = upsertPersona({ alias: 'Owner2', avatar: 'https://avatar/o2' });
  const author = upsertPersona({ alias: 'Author2', avatar: 'https://avatar/a2' });
  const reactor = upsertPersona({ alias: 'Reactor2', avatar: 'https://avatar/r2' });

  const room = createRoom({
    personaId: owner.id,
    name: 'Rule Room',
    type: 'public',
    rulesText: 'Rules',
    settings: { slowModeSeconds: 2 }
  });

  createMessage({ roomId: room.id, senderId: reactor.id, text: 'first message' });

  assert.throws(() => {
    canSendMessage({ roomId: room.id, personaId: reactor.id, text: 'second message too fast' });
  }, /Slow mode active/);

  const msg = createMessage({ roomId: room.id, senderId: author.id, text: 'reward me' });
  toggleReaction({ roomId: room.id, messageId: msg.id, reaction: '🍌', personaId: reactor.id });

  const refreshedAuthor = getPersonaById(author.id);
  assert.equal(refreshedAuthor.score, 101);
});

test('image-only and min score rules are enforced', () => {
  const owner = upsertPersona({ alias: 'Owner3', avatar: 'https://avatar/o3' });
  const low = upsertPersona({ alias: 'LowScore', avatar: 'https://avatar/l3' });

  const room = createRoom({
    personaId: owner.id,
    name: 'Strict Room',
    type: 'public',
    rulesText: 'Strict',
    settings: { imageOnly: true, minScore: 120 }
  });

  assert.throws(() => {
    ensureRoomJoinAllowed({ roomId: room.id, personaId: low.id });
  }, /Minimum score requirement/);

  assert.throws(() => {
    canSendMessage({ roomId: room.id, personaId: owner.id, text: 'plain text blocked' });
  }, /images only/);

  assert.doesNotThrow(() => {
    canSendMessage({ roomId: room.id, personaId: owner.id, text: '/paint jungle city' });
  });
});

test('kick and unban control re-entry', () => {
  const owner = upsertPersona({ alias: 'Owner4', avatar: 'https://avatar/o4' });
  const target = upsertPersona({ alias: 'Target4', avatar: 'https://avatar/t4' });

  const room = createRoom({
    personaId: owner.id,
    name: 'Ban Room',
    type: 'public',
    rulesText: 'Rules',
    settings: {}
  });

  assert.doesNotThrow(() => {
    ensureRoomJoinAllowed({ roomId: room.id, personaId: target.id });
  });

  kickUser({ roomId: room.id, requesterId: owner.id, targetUserId: target.id });

  assert.throws(() => {
    ensureRoomJoinAllowed({ roomId: room.id, personaId: target.id });
  }, /banned/);

  unbanUser({ roomId: room.id, requesterId: owner.id, targetUserId: target.id });

  assert.doesNotThrow(() => {
    ensureRoomJoinAllowed({ roomId: room.id, personaId: target.id });
  });
});

test('monkey mention forces reply even when model says shouldReply false', async (t) => {
  const sender = upsertPersona({ alias: 'MentionTester', avatar: 'https://avatar/m1' });
  const room = createRoom({
    personaId: sender.id,
    name: 'Monkey Reply Room',
    type: 'public',
    rulesText: 'Rules',
    settings: {}
  });

  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      message: { content: '{"shouldReply":false,"replyText":"model tried to skip"}' }
    })
  });

  let emitted = null;
  const io = {
    in: () => ({
      emit: (event, payload) => {
        if (event === 'receive_message') emitted = payload;
      }
    })
  };

  const result = await analyzeMessage({
    io,
    roomId: room.id,
    messageData: { text: 'hey monkey, speak now', sender: { id: sender.id, name: sender.alias } }
  });

  assert.equal(result.available, true);
  assert.ok(emitted);
  assert.equal(emitted.sender.id, 'monkey-ai-admin');
  assert.equal(getPersonaById(sender.id).score, 102);
});

test('monkey parser extracts JSON object from wrapped output', async (t) => {
  const sender = upsertPersona({ alias: 'ParserTester', avatar: 'https://avatar/m2' });
  const room = createRoom({
    personaId: sender.id,
    name: 'Parser Room',
    type: 'public',
    rulesText: 'Rules',
    settings: {}
  });

  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      message: { content: 'Sure, here you go: {"shouldReply":true,"replyText":"wrapped works"}' }
    })
  });

  let monkeyText = '';
  const io = {
    in: () => ({
      emit: (event, payload) => {
        if (event === 'receive_message') monkeyText = payload.text;
      }
    })
  };

  await analyzeMessage({
    io,
    roomId: room.id,
    messageData: { text: 'monkey parse this', sender: { id: sender.id, name: sender.alias } }
  });

  assert.equal(monkeyText, 'wrapped works');
});

test('monkey unavailable path is controlled and does not throw', async (t) => {
  const sender = upsertPersona({ alias: 'TimeoutTester', avatar: 'https://avatar/m3' });
  const room = createRoom({
    personaId: sender.id,
    name: 'Unavailable Room',
    type: 'public',
    rulesText: 'Rules',
    settings: {}
  });

  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => {
    throw new Error('network down');
  };

  const io = {
    in: () => ({
      emit: () => {}
    })
  };

  const result = await analyzeMessage({
    io,
    roomId: room.id,
    messageData: { text: 'monkey still there?', sender: { id: sender.id, name: sender.alias } }
  });

  assert.equal(result.available, false);
  assert.equal(result.reason, 'OLLAMA_UNAVAILABLE');
});

test('channel listing supports nearby/bookmarked/recent scopes', () => {
  const owner = upsertPersona({ alias: 'ScopeOwner', avatar: 'https://avatar/s1' });
  const member = upsertPersona({ alias: 'ScopeMember', avatar: 'https://avatar/s2' });

  const nearbyRoom = createRoom({
    personaId: owner.id,
    name: 'Athens Hub',
    type: 'public',
    rulesText: 'Nearby only',
    settings: {},
    channelMeta: { channelKind: 'location', geohashPrefix: 'dn89h' }
  });
  const recentRoom = createRoom({
    personaId: owner.id,
    name: 'Recent Lounge',
    type: 'public',
    rulesText: 'Recent room',
    settings: {}
  });

  addChannelBookmark({ personaId: member.id, roomId: nearbyRoom.id });

  const nearby = listChannels({ personaId: member.id, scope: 'nearby', geohash: 'dn89' });
  assert.equal(nearby.some((room) => room.id === nearbyRoom.id), true);
  assert.equal(nearby.some((room) => room.id === recentRoom.id), false);

  const bookmarked = listChannels({ personaId: member.id, scope: 'bookmarked' });
  assert.deepEqual(bookmarked.map((room) => room.id), [nearbyRoom.id]);
  assert.equal(bookmarked[0].channelMeta.isBookmarked, true);

  removeChannelBookmark({ personaId: member.id, roomId: nearbyRoom.id });
  const bookmarkedAfterDelete = listChannels({ personaId: member.id, scope: 'bookmarked' });
  assert.equal(bookmarkedAfterDelete.length, 0);
});

test('panic reset revokes active session token', () => {
  const persona = upsertPersona({ alias: 'Panic Tester', avatar: 'https://avatar/panic' });
  const token = createSessionToken(persona.id);

  const verifiedBefore = verifySessionToken(token);
  assert.equal(verifiedBefore.id, persona.id);

  const revokeResult = revokeSessionToken(token);
  assert.equal(revokeResult.revoked, true);
  assert.equal(verifySessionToken(token), null);
});

test('privacy preferences are persisted and patchable', () => {
  const persona = upsertPersona({ alias: 'Privacy Tester', avatar: 'https://avatar/privacy' });

  const defaults = getPrivacyPreferences(persona.id);
  assert.equal(defaults.allowLocation, false);
  assert.equal(defaults.panicModeEnabled, false);

  const updated = updatePrivacyPreferences({
    personaId: persona.id,
    patch: { allowLocation: true, panicModeEnabled: true }
  });

  assert.equal(updated.allowLocation, true);
  assert.equal(updated.panicModeEnabled, true);
});
