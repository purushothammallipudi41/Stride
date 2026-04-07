import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 }, // iPhone 13 Pro dimensions
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
});

test('capture mobile screenshots', async ({ page }) => {
  const isCI = process.env.CI;
  const baseUrl = 'https://stride-frontend-iicg.onrender.com';

  console.log('Navigating to Home...');
  await page.goto(baseUrl + '/');
  // Wait for the feed to load
  await page.waitForTimeout(5000); 
  await page.screenshot({ path: '/Users/purushothammallipudi/.gemini/antigravity/brain/66163597-1741-4b0d-8a02-eba86e15a151/mobile_home.png', fullPage: false });

  console.log('Navigating to Explore...');
  await page.goto(baseUrl + '/explore');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/Users/purushothammallipudi/.gemini/antigravity/brain/66163597-1741-4b0d-8a02-eba86e15a151/mobile_explore.png', fullPage: false });

  console.log('Navigating to Profile...');
  await page.goto(baseUrl + '/profile/stride_official');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/Users/purushothammallipudi/.gemini/antigravity/brain/66163597-1741-4b0d-8a02-eba86e15a151/mobile_profile.png', fullPage: false });
  
  console.log('Mobile screenshots captured successfully.');
});
