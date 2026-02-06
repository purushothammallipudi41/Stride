import config from '../config';

const API_BASE = `${config.API_URL}/api/audius`;

export const audiusService = {
    async getTrending() {
        const response = await fetch(`${API_BASE}/trending`);
        const data = await response.json();
        return this.mapTracks(data.data || []);
    },

    async search(query) {
        if (!query) return [];
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        return this.mapTracks(data.data || []);
    },

    mapTracks(tracks) {
        return tracks.map(track => {
            const artistName = track.user?.name || track.user?.handle || 'Unknown Artist';
            const title = track.title || 'Unknown Track';
            // Clean title if it contains artist name "Title - Artist"
            const cleanTitle = title.replace(new RegExp(`^${artistName}\\s*-\\s*|\\s*-\\s*${artistName}$`, 'i'), '').trim();

            return {
                id: track.id,
                title: cleanTitle || title, // Fallback if cleaning results in empty string
                artist: artistName,
                cover: track.artwork?.['480x480'] ||
                    track.artwork?.['150x150'] ||
                    'https://images.unsplash.com/photo-1514525253344-99a429994c41?q=80&w=600&auto=format',
                streamUrl: `https://api.audius.co/v1/tracks/${track.id}/stream?app_name=STRIDE_SOCIAL`,
                duration: track.duration,
                trackId: track.id
            };
        });
    }
};
