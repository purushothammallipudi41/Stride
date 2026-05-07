/* global process */
import { test, expect } from '@playwright/test';
import { setupMockAuth, verifyAuthState } from './utils/auth-utils';

test.use({
  viewport: { width: 390, height: 844 }, // iPhone 13 Pro dimensions
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
});

test('capture mobile screenshots', async ({ page }) => {
  const isCI = process.env.CI || false;
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:5174';

  // Setup mock authentication
  await setupMockAuth(page);
  
  console.log('Navigating to Home...');
  await page.goto(baseUrl + '/');
  await verifyAuthState(page);
  
  // Wait for the feed to load
  await expect(page.locator('.topbar-logo-text')).toContainText('Vyx');
  await page.waitForTimeout(3000); 
  await page.screenshot({ path: '/Users/purushothammallipudi/.gemini/antigravity/brain/66163597-1741-4b0d-8a02-eba86e15a151/mobile_home.png', fullPage: false });

  console.log('Navigating to Explore...');
  await page.goto(baseUrl + '/explore');
  await expect(page.locator('.explore-container, .category-title').first()).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: '/Users/purushothammallipudi/.gemini/antigravity/brain/66163597-1741-4b0d-8a02-eba86e15a151/mobile_explore.png', fullPage: false });

  console.log('Navigating to Profile...');
  await page.goto(baseUrl + '/profile');
  await expect(page.locator('.ig-profile-bio-block')).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: '/Users/purushothammallipudi/.gemini/antigravity/brain/66163597-1741-4b0d-8a02-eba86e15a151/mobile_profile.png', fullPage: false });
  
  console.log('Mobile screenshots captured successfully.');
});
