import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('onboardingCompleted', 'true'));
  // Set a mock user
  await page.evaluate(() => {
    localStorage.setItem('user', JSON.stringify({
      _id: '507f1f77bcf86cd799439011',
      username: 'test_user',
      avatar: 'https://i.pravatar.cc/150?u=test_user'
    }));
  });
  await page.goto('/'); 
});

test('Jukebox synchronization and LIVE status', async ({ page }) => {
  // Navigate to a community with a jukebox
  await page.goto('/explore');
  await page.waitForSelector('.explore-search-wrapper input');
  await page.fill('.explore-search-wrapper input', '#music');
  await page.keyboard.press('Enter');
  
  await page.waitForSelector('.user-result-card');
  await page.locator('.user-result-card:has-text("Lo-Fi Lounge")').first().click();
  
  // Wait for server view
  await page.waitForSelector('.server-header');
  
  // Join Jukebox channel
  await page.locator('.channel-btn', { hasText: /Jukebox/i }).click();
  
  // Verify synchronization status (indicator should be visible)
  await expect(page.locator('.jukebox-sync-indicator')).toBeVisible();
  
  // Check for the "Add Song" button
  const addSongBtn = page.locator('.add-btn-small');
  await expect(addSongBtn).toBeVisible();
  
  // Simulate adding a song (this might require being a member)
  // The test handles 'Join to Add Beats' if not a member in the UI, 
  // but we can also click the Join button if it exists.
  const joinBtn = page.locator('.join-overlay-btn');
  if (await joinBtn.isVisible()) {
      await joinBtn.click();
  }

  await addSongBtn.click();
  
  // Verify that a song was added to the queue (check for queue-card)
  // We might need to wait for the socket event to round-trip
  await expect(page.locator('.queue-card').first()).toBeVisible({ timeout: 10000 });
  
  // Check for the LIVE indicator if a track is playing
  // Note: This depends on whether a track starts playing automatically
  const liveIndicator = page.locator('.jukebox-sync-indicator');
  if (await liveIndicator.isVisible()) {
      await expect(liveIndicator).toContainText('LIVE');
      await expect(page.locator('.sync-status-bar')).toBeVisible();
  }
});
