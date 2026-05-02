import { test, expect } from '@playwright/test';
import { setupMockAuth, verifyAuthState } from './utils/auth-utils';

test.describe('Social Interactions Extended (DMs & Calls)', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock authentication before navigation
    await setupMockAuth(page);
    
    // Mock the messages API to ensure we have a chat to click
    await page.route('**/api/messages', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-chat-1',
            username: 'StrideOfficial',
            name: 'Stride Official',
            avatar: '',
            isVerified: true,
            messages: [
              { id: 1, text: 'Welcome to Stride!', username: 'StrideOfficial', time: '10:00 AM' }
            ]
          }
        ])
      });
    });

    // Navigate and wait for content
    await page.goto('http://127.0.0.1:5174/messages');
    await verifyAuthState(page);
    
    // Wait for messages to load
    await expect(page).toHaveURL(/.*messages/);
  });

  test('should send a private message and see it in the chat', async ({ page }) => {
    // Select the first chat
    const firstChat = page.locator('.chat-item-v2').first();
    await firstChat.click();

    // Check for v3 window
    await page.waitForSelector('.chat-window-v3:not(.empty)');

    const messageText = `Test message ${Date.now()}`;
    await page.fill('input[placeholder="Message..."]', messageText);
    await page.keyboard.press('Enter');

    // Wait for message to appear with robustness
    const newMessage = page.locator('.message-bubble-v2').last();
    await expect(newMessage).toHaveText(messageText, { timeout: 15000 });
    await expect(page.locator('.message-v2.me').last()).toBeVisible();
  });

  test('should initiate a call and see call overlay', async ({ page }) => {
    // Select a chat
    await page.locator('.chat-item-v2').first().click();
    await page.waitForSelector('.chat-window-v3:not(.empty)');

    // Click call button (header-v2 contains it)
    const callBtn = page.locator('button[aria-label="Audio Call"]');
    await expect(callBtn).toBeVisible();
    await callBtn.click();

    // Check for call overlay (in App.jsx)
    const callOverlay = page.locator('.call-overlay-container');
    await expect(callOverlay).toBeVisible({ timeout: 15000 });
    await expect(callOverlay).toContainText('Calling', { timeout: 15000 });
    
    // End call (control-btn end-btn)
    const endBtn = page.locator('.end-btn');
    await endBtn.click();
    await expect(callOverlay).not.toBeVisible();
  });
});
