import { test, expect } from '@playwright/test';
import { setupMockAuth, verifyAuthState } from './utils/auth-utils';
import { mockAudiusApi } from './utils/audius-mock';

test.beforeEach(async ({ page }) => {
  await mockAudiusApi(page);
  await setupMockAuth(page);
  await page.goto('/music');
  await verifyAuthState(page);
});

test('Music page basic interaction', async ({ page }) => {
  // Page should have the header
  await expect(page.locator('.mobile-page-title')).toContainText('Music');

  // Search input should be visible
  const searchInput = page.getByTestId('music-search-input');
  await expect(searchInput).toBeVisible();

  // Test search functionality (mocking the search results via wait)
  await searchInput.fill('lofi');
  await page.waitForLoadState('networkidle');

  // Check for trending songs if search results are empty (default state)
  const songRows = page.locator('.song-row');
  const count = await songRows.count();
  expect(count).toBeGreaterThan(0);

  // Click the first song to play
  const firstSong = page.locator('.trending-list .song-row').first();
  await expect(firstSong).toBeVisible({ timeout: 5000 });
  await firstSong.click();

  // Mini player or expanded modal should appear
  const miniPlayer = page.locator('.spotify-mini-player, .spotify-expanded-modal.active, .mini-player-container');
  await expect(miniPlayer.first()).toBeVisible({ timeout: 10000 });
});



test('Playlist creation flow', async ({ page }) => {
  // Click create playlist button
  await page.locator('.create-playlist-btn').click();

  // Modal should appear
  const modal = page.locator('.playlist-modal');
  await expect(modal).toBeVisible();

  // Fill in playlist name
  const nameInput = modal.locator('input[placeholder*="Vibe Name"]');
  await nameInput.fill('E2E Test Vibe');
  await page.keyboard.press('Enter');

  // Verify notification or playlist card appears
  // Note: Playlist card might take a moment to render
  const playlistCard = page.locator('.playlist-card:has-text("E2E Test Vibe")').first();
  await expect(playlistCard).toBeVisible({ timeout: 10000 });
});
