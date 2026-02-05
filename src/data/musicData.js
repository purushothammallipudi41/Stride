export const genres = [
    { id: 'g1', name: 'Pop', color: '#ec4899' },
    { id: 'g2', name: 'Hip-Hop', color: '#f59e0b' },
    { id: 'g3', name: 'Rock', color: '#ef4444' },
    { id: 'g4', name: 'Electronic', color: '#8b5cf6' },
    { id: 'g5', name: 'R&B', color: '#3b82f6' },
    { id: 'g6', name: 'Jazz', color: '#10b981' },
    { id: 'g7', name: 'Indie', color: '#6366f1' },
    { id: 'g8', name: 'Classical', color: '#8b5cf6' }
];

export const languages = [
    { id: 'l1', name: 'English' },
    { id: 'l2', name: 'Spanish' },
    { id: 'l3', name: 'Korean' },
    { id: 'l4', name: 'Hindi' },
    { id: 'l5', name: 'Japanese' },
    { id: 'l6', name: 'French' },
    { id: 'l7', name: 'Telugu' },
    { id: 'l8', name: 'Kannada' },
    { id: 'l9', name: 'Tamil' }
];

export const artists = [
    { id: 'a1', name: 'The Weekseeker', image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=60' },
    { id: 'a2', name: 'Neon Dreams', image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&auto=format&fit=crop&q=60' },
    { id: 'a3', name: 'Luna Sol', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60' },
    { id: 'a4', name: 'Bass Drop', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60' },
    { id: 'a5', name: 'Acoustic Soul', image: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=400&auto=format&fit=crop&q=60' }
];

export const albums = [
    {
        id: 'al1',
        title: 'Midnight Horizons',
        artist: 'The Weekseeker',
        cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&auto=format&fit=crop&q=60',
        songs: [
            { id: 's1', title: 'Start Again', duration: 210, artist: 'The Weekseeker' },
            { id: 's2', title: 'City Lights', duration: 195, artist: 'The Weekseeker' },
            { id: 's3', title: 'Fading Out', duration: 245, artist: 'The Weekseeker' }
        ]
    },
    {
        id: 'al2',
        title: 'Electric Soul',
        artist: 'Neon Dreams',
        cover: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=400&auto=format&fit=crop&q=60',
        songs: [
            { id: 's4', title: 'Voltage', duration: 180, artist: 'Neon Dreams' },
            { id: 's5', title: 'Circuit', duration: 220, artist: 'Neon Dreams' }
        ]
    },
    {
        id: 'al3',
        title: 'Acoustic Sessions',
        artist: 'Acoustic Soul',
        cover: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=400&auto=format&fit=crop&q=60',
        songs: [
            { id: 's6', title: 'Morning Dew', duration: 185, artist: 'Acoustic Soul' },
            { id: 's7', title: 'Wooden Heart', duration: 200, artist: 'Acoustic Soul' }
        ]
    },
    {
        id: 'al4',
        title: 'Future Retro',
        artist: 'Luna Sol',
        cover: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=400&auto=format&fit=crop&q=60',
        songs: [
            { id: 's8', title: 'Galaxy', duration: 240, artist: 'Luna Sol' },
            { id: 's9', title: 'Stardust', duration: 210, artist: 'Luna Sol' }
        ]
    }
];

// Helper to get all songs flat
export const getAllSongs = () => {
    return albums.flatMap(album => album.songs.map(song => ({
        ...song,
        cover: album.cover
    })));
};
