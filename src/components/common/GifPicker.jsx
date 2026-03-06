import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
import './GifPicker.css';

const GIPHY_API_KEY = 'zmCxpiFWvT4hH04wK8lmBAZxSGRGJ8f3';
const gf = new GiphyFetch(GIPHY_API_KEY);

const GifPicker = ({ onSelect, onClose, serverStickers = [], type = 'gifs' }) => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState(serverStickers.length > 0 ? 'server' : (type === 'stickers' ? 'stickers' : 'gifs'));
    const [containerWidth, setContainerWidth] = useState(300);
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }
    }, []);

    const fetchGifs = (offset) => {
        const fetchType = activeTab === 'stickers' ? 'stickers' : 'gifs';
        if (search) {
            return gf.search(search, { offset, limit: 15, rating: 'g', type: fetchType === 'stickers' ? 'stickers' : 'gifs' });
        }
        return gf.trending({ offset, limit: 15, rating: 'g', type: fetchType === 'stickers' ? 'stickers' : 'gifs' });
    };

    const handleSelect = (gif, e) => {
        e.preventDefault();
        onSelect(gif.images.fixed_height.url);
    };

    return (
        <div className="gif-picker-panel animate-slide-up" ref={containerRef}>
            <div className="gif-picker-header">
                <div className="gif-picker-top-row">
                    <button
                        className={`gif-tab ${activeTab === 'gifs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('gifs')}
                    >
                        GIFs
                    </button>
                    <button
                        className={`gif-tab ${activeTab === 'stickers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stickers')}
                    >
                        Stickers
                    </button>
                    {serverStickers.length > 0 && (
                        <button
                            className={`gif-tab ${activeTab === 'server' ? 'active' : ''}`}
                            onClick={() => setActiveTab('server')}
                        >
                            Server
                        </button>
                    )}
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
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && <button className="clear-search-btn" onClick={() => setSearch('')}><X size={14} /></button>}
                </div>
            </div>

            <div className="gif-grid-container premium-scrollbar">
                {activeTab === 'server' ? (
                    <div className="server-stickers-grid">
                        {serverStickers.map(sticker => (
                            <button key={sticker._id} onClick={(e) => { e.preventDefault(); onSelect(sticker.url, sticker); }} className="server-sticker-item">
                                <img src={sticker.url} alt={sticker.name} title={sticker.name} />
                            </button>
                        ))}
                    </div>
                ) : (
                    <Grid
                        key={`${activeTab}-${search}`}
                        width={containerWidth - 20}
                        columns={2}
                        gutter={8}
                        fetchGifs={fetchGifs}
                        onGifClick={handleSelect}
                        noLink={true}
                        hideAttribution={true}
                    />
                )}
            </div>
            <div className="tenor-attribution">
                Powered by Giphy
            </div>
        </div>
    );
};

export default GifPicker;
