import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import config from '../../config';
import './GifPicker.css';

const TENOR_API_KEY = 'LIVDSRZULEUE'; // Public key

const FALLBACK_GIFS = [
    { id: 'f1', media: [{ tinygif: { url: 'https://media.tenor.com/images/7f1896e309d29759714e1f72d5c36353/tenor.gif' } }], content_description: 'Happy' },
    { id: 'f2', media: [{ tinygif: { url: 'https://media.tenor.com/images/95cc09e863690d70eb06b3f71c3606f3/tenor.gif' } }], content_description: 'Dance' },
    { id: 'f3', media: [{ tinygif: { url: 'https://media.tenor.com/images/d37682de198d89e51c892f3929ed7666/tenor.gif' } }], content_description: 'Wow' },
    { id: 'f4', media: [{ tinygif: { url: 'https://media.tenor.com/images/4eddb438e8ec4d89668d011110e53a26/tenor.gif' } }], content_description: 'Love' }
];

const FALLBACK_STICKERS = [
    { id: 's1', media: [{ tinygif: { url: 'https://media.tenor.com/images/9c339572863925076618498877840130/tenor.gif' } }], content_description: 'Cool' },
    { id: 's2', media: [{ tinygif: { url: 'https://media.tenor.com/images/90b50306eba69c0d1279f64bf5d7037f/tenor.gif' } }], content_description: 'Vibe' }
];

const GifPicker = ({ onSelect, onClose, type = 'gifs' }) => {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(type === 'stickers' ? 'stickers' : 'gifs');

    useEffect(() => {
        fetchTrending();
    }, [activeTab]);

    const fetchTrending = async () => {
        setLoading(true);
        try {
            const url = `${config.API_URL}/api/gifs/trending?type=${activeTab === 'stickers' ? 'sticker' : 'gif'}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            setResults(data.data && data.data.length > 0 ? data.data : (activeTab === 'stickers' ? FALLBACK_STICKERS : FALLBACK_GIFS));
        } catch (err) {
            console.error('Failed to fetch trending:', err);
            setResults(activeTab === 'stickers' ? FALLBACK_STICKERS : FALLBACK_GIFS);
        }
        setLoading(false);
    };

    const handleSearch = async (query) => {
        setSearch(query);
        if (!query.trim()) {
            fetchTrending();
            return;
        }
        setLoading(true);
        try {
            const url = `${config.API_URL}/api/gifs/search?q=${encodeURIComponent(query)}&type=${activeTab === 'stickers' ? 'sticker' : 'gif'}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setResults(data.data || []);
        } catch (err) {
            console.error('Failed to search GIFs:', err);
        }
        setLoading(false);
    };

    return (
        <div className="gif-picker-panel animate-slide-up">
            <div className="gif-picker-header">
                <div className="gif-picker-top-row">
                    <div className="gif-tabs">
                        <button className={`gif-tab ${activeTab === 'gifs' ? 'active' : ''}`} onClick={() => setActiveTab('gifs')}>
                            GIFs
                        </button>
                        <button className={`gif-tab ${activeTab === 'stickers' ? 'active' : ''}`} onClick={() => setActiveTab('stickers')}>
                            Stickers
                        </button>
                    </div>
                    {onClose && (
                        <button className="close-btn-mini" onClick={onClose}><X size={18} /></button>
                    )}
                </div>
                <div className="search-bar-mini">
                    <Search size={14} color="rgba(255,255,255,0.5)" />
                    <input
                        type="text"
                        placeholder={activeTab === 'stickers' ? "Search stickers..." : "Search GIFs..."}
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    {search && <button className="clear-search-btn" onClick={() => handleSearch('')}><X size={14} /></button>}
                </div>
            </div>

            <div className="gif-grid premium-scrollbar">
                {loading && (
                    <div className="gif-loader">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                )}
                {!loading && results.map((gif) => (
                    <div
                        key={gif.id}
                        className="gif-item"
                        onClick={() => onSelect(gif.images ? gif.images.fixed_height_small.url : gif.media[0].tinygif.url)}
                    >
                        <img
                            src={gif.images ? gif.images.fixed_height_small.url : gif.media[0].tinygif.url}
                            alt={gif.title || gif.content_description}
                        />
                    </div>
                ))}
                {!loading && results.length === 0 && (
                    <div className="no-results">No {activeTab} found</div>
                )}
            </div>
            <div className="tenor-attribution">
                Powered by Giphy
            </div>
        </div>
    );
};

export default GifPicker;
