/**
 * Unified Authentication Helper for Stride E2E Tests
 */

export async function setupMockAuth(page, userData = {}) {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    name: 'Test Artist',
    email: 'test@example.com',
    avatar: '',
    bio: 'Music is my life!',
    onboardingCompleted: true,
    accentColor: '#8b5cf6',
    communities: ['1', 'stride-official'],
    ...userData
  };

  // Mock Discovery API
  await page.route('**/api/discovery/feed', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        trendingCommunities: [
          { _id: 'comm1', name: 'Lo-Fi Lounge', memberCount: 1337, primaryColor: '#8b5cf6', avatar: '' }
        ],
        discoverGrid: [
          { id: 'post1', type: 'image', contentUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17', username: 'testuser' }
        ]
      })
    });
  });

  // Mock Trending/Search API
  await page.route('**/api/search/trending', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        trendingTags: [{ tag: '#stride', count: 42 }]
      })
    });
  });

  // Mock Leaderboard API
  await page.route('**/api/communities/leaderboard', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { _id: 'comm1', name: 'Lo-Fi Lounge', vibeScore: 9999, avatar: '' }
      ])
    });
  });

  // Mock Global Communities API
  await page.route('**/api/communities', async (route) => {
    if (route.request().method() === 'POST') {
      const data = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'new_comm', ...data, memberCount: 1, members: [mockUser._id] })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 'comm1', name: 'Lo-Fi Lounge', memberCount: 1337, primaryColor: '#8b5cf6', avatar: '', owner: 'puru', members: [] }
        ])
      });
    }
  });

  // Mock Join Community
  await page.route('**/api/communities/*/join', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Joined nexus' })
    });
  });

  // Mock Notification Counts
  await page.route('**/api/notifications/unread-count/**', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ count: 0 }) });
  });

  await page.route('**/api/messages/unread-count/**', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ count: 0 }) });
  });

  // Mock Profile API
  await page.route('**/api/profile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        username: mockUser.username,
        name: 'Test Artist',
        bio: 'Just a music lover on Stride 🎵',
        avatar: '',
        avatarFrame: 'none',
        followerCount: 123,
        followingCount: 456,
        isVerified: true,
        posts: [
          { id: 'p1', contentUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17', username: mockUser.username, likes: 10, comments: 2 }
        ],
        achievements: ['Music Maven']
      })
    });
  });

  // Mock Music API
  await page.route('**/api/music/playlists/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/playlists/**', async (route) => {
    if (route.request().method() === 'POST') {
       const data = route.request().postDataJSON();
       await route.fulfill({
         status: 201,
         contentType: 'application/json',
         body: JSON.stringify({ _id: 'new_playlist', ...data, tracks: [] })
       });
    } else {
       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.route('**/api/playlists', async (route) => {
    const data = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ _id: 'new_playlist', ...data, tracks: [] })
    });
  });

  await page.route('**/api/music/genres', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: "g1", name: "Pop", color: "#ec4899" }]) });
  });

  await page.route('**/api/music/artists', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/music/albums', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/music/languages', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: "l1", name: "English" }])
    });
  });

  // Mock Wallet/Tip API
  await page.route('**/api/wallet/tip', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, user: { ...mockUser, balance: 950 } })
    });
  });

  // Mock Profile Update API
  await page.route('**/api/profile/update', async (route) => {
    const postData = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, user: { ...mockUser, ...postData } })
    });
  });

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
              artwork: { '150x150': '', '480x480': '' },
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
  }, { user: mockUser });
}

export async function verifyAuthState(page) {
  const isAuth = await page.evaluate(() => localStorage.getItem('isAuthenticated'));
  if (isAuth !== 'true') {
    throw new Error('Mock authentication failed to persist');
  }
}
