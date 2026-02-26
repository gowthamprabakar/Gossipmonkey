import { test, expect } from '@playwright/test';

const unique = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const completeOnboarding = async (page, alias) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Enter Jungle/i }).click();
  await expect(page.getByText(/Claim Your Alias/i)).toBeVisible();
  const aliasInput = page.locator('input').first();
  await aliasInput.fill(alias);
  await page.getByRole('button', { name: /^Enter Jungle$/i }).click();
  await expect(page.getByText(/Explore Channels/i)).toBeVisible();
};

const waitForBrowserStable = async (page) => {
  const loading = page.getByText(/Loading channels/i);
  if (await loading.count()) {
    await expect(loading).toHaveCount(0, { timeout: 20000 });
  }
};

const openCreateChannel = async (page) => {
  await page.getByRole('button', { name: /\+ Create/i }).click();
  await expect(page.getByText(/Create Channel/i)).toBeVisible();
};

const ensureInChatRoomByName = async (page, roomName) => {
  const chatInput = page.getByPlaceholder('Type something...');

  for (let i = 0; i < 12; i += 1) {
    if (await chatInput.count()) {
      await expect(chatInput).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(roomName)).toBeVisible({ timeout: 5000 });
      return;
    }

    await waitForBrowserStable(page);

    const card = page.locator('article').filter({ hasText: roomName }).first();
    if (await card.count()) {
      await card.getByRole('button', { name: /^Join$/i }).click();
    }

    await page.waitForTimeout(800);
  }

  await expect(chatInput).toBeVisible({ timeout: 15000 });
};

const getAuthToken = async (page) => page.evaluate(() => localStorage.getItem('chat_monkey_token'));

const getRoomCodeByNameViaApi = async (page, roomName) => {
  const token = await getAuthToken(page);
  const response = await page.request.get('http://127.0.0.1:3000/api/rooms', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await response.json();
  const room = body.data.find((r) => r.name === roomName);
  return room?.accessCode;
};

const waitForRoomCode = async (page, roomName) => {
  for (let i = 0; i < 20; i += 1) {
    const code = await getRoomCodeByNameViaApi(page, roomName);
    if (code) return code;
    await page.waitForTimeout(300);
  }
  return null;
};

const createChannelFromUI = async (page, { name, approvalRequired = false }) => {
  await openCreateChannel(page);
  await page.getByPlaceholder('Channel Name').fill(name);
  await page.getByPlaceholder('Rules').fill('Be kind');

  if (approvalRequired) {
    await page.getByText('Approval Required').click();
  }

  await page.getByRole('button', { name: /Create & Join/i }).click();

  const code = await waitForRoomCode(page, name);
  expect(code).toBeTruthy();

  await ensureInChatRoomByName(page, name);
  return code;
};

const joinByCode = async (page, code) => {
  await page.goto(`/join?room=${code}`);
  await page.getByRole('button', { name: /Enter Room/i }).click();
};

test('Journey: onboarding -> create channel with approval -> invite by code -> join', async ({ browser }) => {
  const adminContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const admin = await adminContext.newPage();
  const guest = await guestContext.newPage();

  const roomName = unique('ApprovalRoom');

  await completeOnboarding(admin, unique('Admin'));
  const code = await createChannelFromUI(admin, { name: roomName, approvalRequired: true });
  await expect(admin.getByRole('heading', { name: /The Troop/i })).toBeVisible();
  await expect(admin.getByText(/THE MONKEY IS:/i)).toBeVisible();
  await expect(admin.getByRole('button', { name: /Share Link/i })).toBeVisible();

  await completeOnboarding(guest, unique('Guest'));
  await joinByCode(guest, code);

  await expect(guest.getByText(/Knocking/i)).toBeVisible();

  await admin.getByRole('button', { name: /Admin/i }).click();
  await admin.getByRole('button', { name: /Allow/i }).first().click();

  await expect(guest.getByPlaceholder('Type something...')).toBeVisible();

  await adminContext.close();
  await guestContext.close();
});

test('Journey: non-admin flags message -> admin deletes from flag queue', async ({ browser }) => {
  const adminContext = await browser.newContext();
  const memberContext = await browser.newContext();
  const admin = await adminContext.newPage();
  const member = await memberContext.newPage();

  const roomName = unique('FlagRoom');

  await completeOnboarding(admin, unique('AdminFlag'));
  const code = await createChannelFromUI(admin, { name: roomName, approvalRequired: false });

  await completeOnboarding(member, unique('MemberFlag'));
  await joinByCode(member, code);
  await ensureInChatRoomByName(member, roomName);

  const adminMsg = unique('admin-message');
  await admin.getByPlaceholder('Type something...').fill(adminMsg);
  await admin.keyboard.press('Enter');

  const adminMessageBubble = member.locator('div').filter({ hasText: adminMsg }).first();
  await expect(adminMessageBubble).toBeVisible();
  await adminMessageBubble.hover();
  await member.getByRole('button', { name: /Flag/i }).first().click();

  await admin.getByRole('button', { name: /Admin/i }).click();
  await expect(admin.getByText(/Flags/i)).toBeVisible();
  await admin.getByRole('button', { name: /Delete Msg/i }).first().click();

  await expect(member.getByText(adminMsg)).toHaveCount(0);

  await adminContext.close();
  await memberContext.close();
});

test('Journey: admin kicks user -> user sees removed state and cannot continue chat', async ({ browser }) => {
  const adminContext = await browser.newContext();
  const memberContext = await browser.newContext();
  const admin = await adminContext.newPage();
  const member = await memberContext.newPage();

  const roomName = unique('KickRoom');

  await completeOnboarding(admin, unique('AdminKick'));
  const code = await createChannelFromUI(admin, { name: roomName, approvalRequired: false });

  await completeOnboarding(member, unique('MemberKick'));
  await joinByCode(member, code);
  await ensureInChatRoomByName(member, roomName);

  const memberMsg = unique('kick-target');
  await member.getByPlaceholder('Type something...').fill(memberMsg);
  await member.keyboard.press('Enter');

  const memberBubbleOnAdmin = admin.locator('div').filter({ hasText: memberMsg }).first();
  await expect(memberBubbleOnAdmin).toBeVisible();
  await memberBubbleOnAdmin.hover();
  await admin.getByRole('button', { name: /Kick/i }).first().click();

  await expect(member.getByText(/You were removed/i)).toBeVisible();

  await adminContext.close();
  await memberContext.close();
});

test('Journey: mention monkey -> unavailable badge appears while chat remains usable', async ({ page }) => {
  await completeOnboarding(page, unique('AiStatus'));
  const roomName = unique('AiRoom');
  await createChannelFromUI(page, { name: roomName, approvalRequired: false });

  const message = `monkey ${unique('trigger-ai')}`;
  await page.getByPlaceholder('Type something...').fill(message);
  await page.keyboard.press('Enter');

  await expect(page.getByText(message)).toBeVisible();
  await expect(page.getByText(/Monkey AI unavailable/i)).toBeVisible();
});

test('Journey: panic reset clears session and redirects to onboarding', async ({ page }) => {
  await completeOnboarding(page, unique('PrivacyUser'));

  await page.goto('/privacy');
  await expect(page.getByText(/Privacy Controls/i)).toBeVisible();
  await page.getByRole('button', { name: /Panic Reset Session/i }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText(/Claim Your Alias/i)).toBeVisible();
});
