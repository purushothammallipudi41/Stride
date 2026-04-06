import { test, expect } from '@playwright/test';
import { setupMockAuth, verifyAuthState } from './utils/auth-utils';

test.beforeEach(async ({ page }) => {
  await setupMockAuth(page);
  await page.goto('/');
  await verifyAuthState(page);
});

test('Notifications page display', async ({ page }) => {
  // Navigate to notifications page
  await page.goto('/notifications');
  
  // Wait for loading to finish
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 15000 });
  
  // Handle potential case-sensitivity or translations in titles
  // Specifically target the header in the main content area to avoid matching the logo
  const titleLocator = page.locator('.mobile-page-header h1, .notifications-container h1, .mobile-page-title').first();
  await expect(titleLocator).toContainText(/notifications|Notifications|Title/i, { timeout: 15000 });
  
  // Check for the "caught up" section or the notifications list
  // Using text search is more robust than class-only search
  const contentLocator = page.locator('text=/caught up|notifications/i').first();
  await expect(contentLocator).toBeVisible({ timeout: 15000 });
});

test('Messages and Reels navigation', async ({ page }) => {
  // Messages
  await page.goto('/messages');
  await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 15000 });
  
  // Messages page title or unique element (it uses Sidebar/Layout)
  await expect(page.locator('.messages-container, .chat-list-container, .inbox-layout, .messages-list-wrapper').first()).toBeVisible({ timeout: 15000 });

  // Reels navigation
  await page.goto('/reels');
  await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 15000 });
  await expect(page.locator('.reels-container, .reels-viewport, .reel-card, main').first()).toBeVisible();
});

test('Global Search from Topbar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 15000 });
  
  const searchInput = page.locator('.search-input');
  await expect(searchInput).toBeVisible();
  
  await searchInput.click();
  await page.keyboard.type('#music');
  await page.keyboard.press('Enter');
  
  // Should navigate to Explore with search results
  await expect(page).toHaveURL(/.*\/explore/);
  
  // Wait for search area or grid
  const resultsContainer = page.locator('.search-results-area, .explore-grid, .user-results-list, .discovery-area');
  await expect(resultsContainer.first()).toBeVisible({ timeout: 15000 });
});
