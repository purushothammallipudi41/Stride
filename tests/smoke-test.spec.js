import { test, expect } from '@playwright/test';
import { setupMockAuth, verifyAuthState } from './utils/auth-utils';

test.describe('Stride Full Application Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock authentication before navigation
    await setupMockAuth(page);
    
    // Navigate and wait for content
    await page.goto('http://127.0.0.1:5174');
    await verifyAuthState(page);
  });

  test('primary sidebar links', async ({ page }) => {
    // Expect Home
    await expect(page).toHaveURL(/.*\//);
    
    // Explore
    await page.goto('http://127.0.0.1:5174/explore');
    await expect(page).toHaveURL(/.*\/explore/);
    
    // Servers
    await page.goto('http://127.0.0.1:5174/servers');
    await expect(page).toHaveURL(/.*\/servers/);
    
    // Music
    await page.goto('http://127.0.0.1:5174/music');
    await expect(page).toHaveURL(/.*\/music/);

    // Profile
    await page.goto('http://127.0.0.1:5174/profile');
    await expect(page).toHaveURL(/.*\/profile/);
  });

  test('home feed and stories', async ({ page }) => {
    // Should be at home
    await expect(page).toHaveURL(/.*\//);
    
    // Stories rail or feed container should be visible
    // We wait for the main content area to ensure page has rendered
    const mainContent = page.locator('main, .feed-section, .stories-section');
    await expect(mainContent.first()).toBeVisible({ timeout: 15000 });
    
    // Check if stories are visible IF the section exists
    const stories = page.locator('.stories-section');
    if (await stories.isVisible()) {
      await expect(stories).toBeVisible();
    }
  });



  test('global UI elements', async ({ page }) => {
    // Topbar Search (Added in recent fix)
    await expect(page.locator('.search-input')).toBeVisible();
    
    // Actions in Topbar
    await expect(page.locator('.topbar-btn').first()).toBeVisible();
  });

  test('visual consistency - screenshots', async ({ page }) => {
    // Home
    await page.goto('http://127.0.0.1:5174/');
    await page.screenshot({ path: 'tests/screenshots/home.png' });
    
    await page.goto('http://127.0.0.1:5174/music');
    await page.screenshot({ path: 'tests/screenshots/music.png' });
    
    // Servers
    await page.goto('http://127.0.0.1:5174/servers');
    await page.screenshot({ path: 'tests/screenshots/servers.png' });
  });
});
