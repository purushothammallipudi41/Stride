/**
 * Unified Authentication Helper for Stride E2E Tests
 */

export async function setupMockAuth(page, userData = {}) {
  const defaultUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    name: 'Test Artist',
    email: 'test@example.com',
    avatar: 'https://i.pravatar.cc/150?u=testuser',
    bio: 'Music is my life!',
    onboardingCompleted: true,
    accentColor: '#8b5cf6',
    communities: ['1', 'stride-official'],
    ...userData
  };

  // Mock Audius API more aggressively to catch all discovery node subdomains
  // Use a regex to match and avoid URL object issues
  await page.route(/.*audius.*/, async route => {
    const url = route.request().url();
    if (url.includes('/v1/tracks') || url.includes('/v1/users')) {
      console.log(`[E2E MOCK] Catching Audius request: ${url}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'mock_track_1',
              title: 'Mock Vibe',
              user: { name: 'Mock Artist' },
              artwork: { '150x150': 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150', '480x480': 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=480' },
              duration: 180
            }
          ]
        })
      });
    } else {
      await route.continue();
    }
  });

  // Mock Audius Discovery URL itself (main entry point)
  await page.route('https://api.audius.co', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: ['http://127.0.0.1:5174/mock-audius']
      })
    });
  });

  await page.addInitScript(({ user }) => {
    window.localStorage.setItem('isAuthenticated', 'true');
    window.localStorage.setItem('isE2E', 'true');
    window.localStorage.setItem('user', JSON.stringify(user));
    window.localStorage.setItem('onboardingCompleted', 'true');
  }, { user: defaultUser });
}

export async function verifyAuthState(page) {
  const isAuth = await page.evaluate(() => localStorage.getItem('isAuthenticated'));
  if (isAuth !== 'true') {
    throw new Error('Mock authentication failed to persist');
  }
}
