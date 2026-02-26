import test from 'node:test';
import assert from 'node:assert/strict';

import { apiClient } from '../src/services/apiClient.js';
import { createSession, panicResetSession } from '../src/services/identityService.js';
import { getRooms, createRoom, updateRoomSettings } from '../src/services/roomService.js';
import { getChannels, bookmarkChannel, unbookmarkChannel } from '../src/services/channelService.js';
import { getPrivacyPreferences, updatePrivacyPreferences } from '../src/services/privacyService.js';
import { filterAndSortRooms, computeProfileStats } from '../src/utils/featureUtils.js';

const localStorageMock = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
};

global.localStorage = localStorageMock();

const mockFetch = (impl) => {
  global.fetch = impl;
};

test('Feature: API client attaches bearer token and content-type', async () => {
  localStorage.setItem('chat_monkey_token', 'token-123');

  let captured;
  mockFetch(async (_url, options) => {
    captured = options;
    return {
      ok: true,
      json: async () => ({ success: true, data: { ok: true } })
    };
  });

  const result = await apiClient('/identity/me');
  assert.equal(result.success, true);
  assert.equal(captured.headers.Authorization, 'Bearer token-123');
  assert.equal(captured.headers['Content-Type'], 'application/json');
});

test('Feature: Identity session request sends alias + avatar payload', async () => {
  let payload;
  mockFetch(async (_url, options) => {
    payload = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ success: true, data: { persona: { id: 'p1' }, token: 't1' } })
    };
  });

  const result = await createSession({ alias: 'Funky Baboon 99', avatar: 'https://avatar' });

  assert.equal(result.success, true);
  assert.equal(payload.alias, 'Funky Baboon 99');
  assert.equal(payload.avatar, 'https://avatar');
});

test('Feature: Room list and create/update room APIs use expected contracts', async () => {
  const calls = [];
  mockFetch(async (url, options = {}) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({ success: true, data: [] })
    };
  });

  await getRooms();
  await createRoom({
    name: 'VIP Lounge',
    type: 'public',
    rulesText: 'Be kind',
    settings: {
      approvalRequired: true,
      slowModeSeconds: 5,
      imageOnly: false,
      minScore: 20,
      lockRoom: false,
      muteAll: false
    }
  });
  await updateRoomSettings('room-1', { muteAll: true, lockRoom: true });

  assert.equal(calls.length, 3);
  assert.match(calls[0].url, /\/rooms$/);
  assert.equal(calls[0].options.method, undefined);

  const createPayload = JSON.parse(calls[1].options.body);
  assert.equal(createPayload.name, 'VIP Lounge');
  assert.equal(createPayload.settings.approvalRequired, true);
  assert.equal(createPayload.settings.slowModeSeconds, 5);

  const patchPayload = JSON.parse(calls[2].options.body);
  assert.equal(calls[2].options.method, 'PATCH');
  assert.equal(patchPayload.muteAll, true);
  assert.equal(patchPayload.lockRoom, true);
});

test('Feature: Lobby filtering and hot sorting behavior', () => {
  const rooms = [
    { id: '1', name: 'Chill Hub', requiresApproval: false, activeCount: 2 },
    { id: '2', name: 'Chaos Club', requiresApproval: true, activeCount: 12 },
    { id: '3', name: 'Public Jungle', requiresApproval: false, activeCount: 8 }
  ];

  const hot = filterAndSortRooms({ rooms, activeTab: 'hot', searchQuery: '' });
  assert.deepEqual(hot.map((r) => r.id), ['2', '3', '1']);

  const pub = filterAndSortRooms({ rooms, activeTab: 'public', searchQuery: '' });
  assert.deepEqual(pub.map((r) => r.id), ['1', '3']);

  const priv = filterAndSortRooms({ rooms, activeTab: 'private', searchQuery: '' });
  assert.deepEqual(priv.map((r) => r.id), ['2']);

  const searched = filterAndSortRooms({ rooms, activeTab: 'hot', searchQuery: 'chill' });
  assert.deepEqual(searched.map((r) => r.id), ['1']);
});

test('Feature: Profile stats derive rooms created correctly', () => {
  const rooms = [
    { id: '1', creatorId: 'owner' },
    { id: '2', creatorId: 'owner' },
    { id: '3', creatorId: 'other' }
  ];

  const stats = computeProfileStats({ rooms, personaId: 'owner' });
  assert.equal(stats.roomsCreated, 2);
  assert.equal(stats.rewards, 0);
});

test('Feature: Channel listing/bookmark APIs and privacy APIs use expected contracts', async () => {
  const calls = [];
  mockFetch(async (url, options = {}) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({ success: true, data: {} })
    };
  });

  await getChannels({ scope: 'nearby', geohash: 'dn89', q: 'banana' });
  await bookmarkChannel('room-1');
  await unbookmarkChannel('room-1');
  await getPrivacyPreferences();
  await updatePrivacyPreferences({ allowLocation: true, panicModeEnabled: false });
  await panicResetSession();

  assert.match(calls[0].url, /\/channels\?scope=nearby&geohash=dn89&q=banana$/);
  assert.match(calls[1].url, /\/channels\/room-1\/bookmark$/);
  assert.equal(calls[1].options.method, 'POST');
  assert.equal(calls[2].options.method, 'DELETE');
  assert.match(calls[3].url, /\/privacy\/me$/);
  assert.equal(calls[4].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[4].options.body), { allowLocation: true, panicModeEnabled: false });
  assert.match(calls[5].url, /\/identity\/panic-reset$/);
  assert.equal(calls[5].options.method, 'POST');
});
