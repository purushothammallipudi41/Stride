import { test, expect } from '@playwright/test';
import { setupMockAuth, verifyAuthState } from './utils/auth-utils';

test.beforeEach(async ({ page }) => {
  await setupMockAuth(page);
  await page.goto('/');
  await verifyAuthState(page);
});

test('App loads and user can navigate to explore', async ({ page }) => {
  await expect(page.locator('.topbar-logo-text')).toContainText('Vyx');
  
  await page.goto('/explore');
  await expect(page.locator('.explore-container, .category-title').first()).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(/.*explore/);
});

test('Community interaction flow', async ({ page }) => {
  await page.goto('/explore');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for communities section or trending hashtags
  await expect(page.locator('.category-title').first()).toBeVisible({ timeout: 15000 });
  
  // Navigate to a community if visible, or search
  const communityCard = page.locator('.user-result-card, .discovery-community-card').first();
  if (await communityCard.isVisible()) {
      await communityCard.click();
  } else {
      // Try searching for a known tag
      await page.fill('.search-input', '#vyx');
      await page.keyboard.press('Enter');
      
      // Wait for results
      const resultCard = page.locator('.user-result-card').filter({ hasText: /Lo-Fi Lounge/i }).first();
      await expect(resultCard).toBeVisible({ timeout: 20000 });
      await resultCard.click();
  }
  
  // Wait for the community view to load by checking the header
  await expect(page.locator('.server-header')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.server-name')).not.toBeEmpty();
});
