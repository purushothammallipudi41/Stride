const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

let audiusNode = 'https://api.audius.co';

// GET /api/audius/search
router.get('/search', async (req, res) => {
    try {
        const response = await fetch(`${audiusNode}/v1/tracks/search?query=${req.query.q}&app_name=STRIDE_SOCIAL`);
        res.json(await response.json());
    } catch (e) { res.status(503).json({ error: 'Audius API unavailable' }); }
});

// GET /api/audius/trending
router.get('/trending', async (req, res) => {
    try {
        const response = await fetch(`${audiusNode}/v1/tracks/trending?app_name=STRIDE_SOCIAL`);
        res.json(await response.json());
    } catch (e) { res.status(503).json({ error: 'Audius API unavailable' }); }
});

// GET /api/audius/stream/:id
router.get('/stream/:id', async (req, res) => {
    try {
        const trackId = req.params.id;
        const initialUrl = `${audiusNode}/v1/tracks/${trackId}/stream?app_name=STRIDE_SOCIAL`;

        const response = await fetch(initialUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Range': 'bytes=0-'
            }
        });

        if (!response.ok) {
            return res.status(response.status).send('Stream unavailable');
        }

        res.set('Content-Type', response.headers.get('content-type'));
        res.set('Content-Length', response.headers.get('content-length'));
        res.set('Accept-Ranges', 'bytes');
        res.set('Access-Control-Allow-Origin', '*');

        response.body.pipe(res);
    } catch (e) {
        console.error('[AUDIUS STREAM] Error:', e);
        res.status(500).send("Stream error");
    }
});

// GET /api/audius/image
router.get('/image', async (req, res) => {
    try {
        let url = req.query.url;
        if (!url) return res.status(400).send('URL required');

        if (!url.includes('audius')) {
            return res.status(403).send('Only Audius images allowed');
        }

        const contentMatch = url.match(/\/content\/([a-zA-Z0-9]+)\/([a-zA-Z0-9x.]+)/);
        if (contentMatch) {
            url = `https://audius-content-13.figment.io/content/${contentMatch[1]}/${contentMatch[2]}`;
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': 'https://audius.co/'
            },
            timeout: 8000
        });

        if (!response.ok) throw new Error(`Gateway returned ${response.status}`);

        res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=604800');
        response.body.pipe(res);
    } catch (e) {
        res.status(500).send('Proxy error');
    }
});

module.exports = router;
