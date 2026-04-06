import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('onboardingCompleted', 'true'));
  await page.goto('/'); // Reload to apply localStorage
});

test('App loads and user can navigate to explore', async ({ page }) => {
  await expect(page.locator('.topbar-logo-text')).toContainText('Stride');
  
  await page.goto('/explore');
  await expect(page.locator('.explore-container, .category-title').first()).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(/.*explore/);
});

test('Community interaction flow', async ({ page }) => {
  await page.goto('/explore');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for communities section or trending hashtags
  await expect(page.locator('.category-title').first()).toBeVisible({ timeout: 10000 });
  
  // Navigate to a community if visible, or search
  const communityCard = page.locator('.user-result-card').first();
  if (await communityCard.isVisible()) {
      await communityCard.click();
  } else {
      // Try searching for a known tag
      await page.fill('.explore-search-wrapper input', '#music');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      
      // Wait for the communities section to appear and click Lo-Fi Lounge
      await page.waitForSelector('.user-result-card');
      await page.locator('.user-result-card:has-text("Lo-Fi Lounge")').first().click();
      
      // Wait for the community view to load by checking the header
      await page.waitForSelector('.server-header .server-name');
  }
  
  // Verify we are in a community view
  await expect(page.locator('.server-header')).toBeVisible({ timeout: 15000 });
});
