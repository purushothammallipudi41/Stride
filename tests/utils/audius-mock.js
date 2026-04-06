import { Buffer } from 'node:buffer';

/**
 * Utility to mock Audius API responses in Playwright tests.
 * This avoids network latency and external dependency failures.
 */
export async function mockAudiusApi(page) {
    await page.route('https://api.audius.co', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                data: ['https://discoveryprovider.audius.co']
            })
        });
    });

    await page.route('**/v1/tracks/trending**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                data: [
                    {
                        id: 'mock-1',
                        title: 'Mock Trending Track 1',
                        user: { name: 'Mock Artist 1' },
                        artwork: { '150x150': 'https://via.placeholder.com/150' },
                        duration: 180
                    },
                    {
                        id: 'mock-2',
                        title: 'Mock Trending Track 2',
                        user: { name: 'Mock Artist 2' },
                        artwork: { '150x150': 'https://via.placeholder.com/150' },
                        duration: 210
                    }
                ]
            })
        });
    });

    await page.route('**/v1/tracks/search**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                data: [
                    {
                        id: 'search-1',
                        title: 'Lofi Vibes',
                        user: { name: 'Study Girl' },
                        artwork: { '150x150': 'https://via.placeholder.com/150' },
                        duration: 300
                    }
                ]
            })
        });
    });

    await page.route('**/v1/tracks/**/stream**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'audio/mpeg',
            body: Buffer.alloc(0) // Dummy empty audio
        });
    });
}
