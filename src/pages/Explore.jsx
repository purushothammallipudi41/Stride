import { useState, useEffect } from 'react';
import { Search, Music, Play, TrendingUp, Share2 } from 'lucide-react';
import { audiusService } from '../services/audiusService';
import { useMusic } from '../context/MusicContext';
import ShareModal from '../components/common/ShareModal';
import './Explore.css';

const Explore = () => {
    const { playTrack, currentTrack, isPlaying } = useMusic();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loadingTrending, setLoadingTrending] = useState(true);
    const [loading, setLoading] = useState(false);
    const [shareData, setShareData] = useState(null);

    const handleShare = (track) => {
        setShareData({
            id: track.id,
            title: track.title,
            subtitle: track.artist,
            image: track.cover
        });
    };

    useEffect(() => {
        const fetchTrending = async () => {
            setLoadingTrending(true);
            try {
                const tracks = await audiusService.getTrending();
                setTrending(tracks);
            } catch (error) {
                console.error('Failed to fetch trending tracks:', error);
            } finally {
                setLoadingTrending(false);
            }
        };
        fetchTrending();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const debounce = setTimeout(async () => {
            setLoading(true);
            try {
                const results = await audiusService.search(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(debounce);
    }, [searchQuery]);

    return (
        <div className="explore-page">
            <header className="explore-header">
                <div className="search-container">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search artists, tracks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <main className="explore-content">
                {searchQuery ? (
                    <section className="results-section">
                        <div className="section-header">
                            <Music size={24} />
                            <h3>{loading ? 'Searching...' : `Results for "${searchQuery}"`}</h3>
                        </div>
                        {loading ? (
                            <div className="flex-center" style={{ padding: '40px' }}>
                                <div className="loading-spinner"></div>
                            </div>
                        ) : (
                            <div className="tracks-grid">
                                {searchResults.map(track => (
                                    <TrackCard
                                        key={track.id}
                                        track={track}
                                        onPlay={() => playTrack(track, searchResults)}
                                        active={currentTrack?.id === track.id && isPlaying}
                                        onShare={handleShare}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        <section className="trending-section">
                            <div className="section-header">
                                <TrendingUp size={24} />
                                <h3>Trending Now</h3>
                            </div>
                            {loadingTrending ? (
                                <div className="flex-center" style={{ padding: '40px' }}>
                                    <div className="loading-spinner"></div>
                                </div>
                            ) : (
                                <div className="tracks-grid">
                                    {trending.map(track => (
                                        <TrackCard
                                            key={track.id}
                                            track={track}
                                            onPlay={() => playTrack(track, trending)}
                                            active={currentTrack?.id === track.id && isPlaying}
                                            onShare={handleShare}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            {shareData && (
                <ShareModal
                    isOpen={!!shareData}
                    onClose={() => setShareData(null)}
                    type="song"
                    data={shareData}
                />
            )}
        </div>
    );
};

const TrackCard = ({ track, onPlay, active, onShare }) => (
    <div className={`track-card ${active ? 'active' : ''}`}>
        <div className="card-image-wrap" onClick={onPlay}>
            <img src={track.cover} alt={track.title} />
            <div className="play-overlay">
                <Play size={32} fill="currentColor" />
            </div>
        </div>
        <div className="card-info">
            <div onClick={onPlay} style={{ cursor: 'pointer' }}>
                <h4>{track.title}</h4>
                <p>{track.artist}</p>
            </div>
            <button
                className="track-share-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    onShare(track);
                }}
            >
                <Share2 size={16} />
            </button>
        </div>
    </div>
);

export default Explore;
