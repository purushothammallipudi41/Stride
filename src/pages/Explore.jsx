import { useState, useEffect } from 'react';
import { Search, Music, Play, TrendingUp, Share2, User, Heart, MessageCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { audiusService } from '../services/audiusService';
import { useMusic } from '../context/MusicContext';
import ShareModal from '../components/common/ShareModal';
import config from '../config';
import { getImageUrl } from '../utils/imageUtils';
import './Explore.css';

const Explore = () => {
    const { playTrack, currentTrack, isPlaying } = useMusic();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [userResults, setUserResults] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loadingTrending, setLoadingTrending] = useState(true);
    const { unreadCount } = useNotifications();
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
            setUserResults([]);
            return;
        }

        const debounce = setTimeout(async () => {
            setLoading(true);
            try {
                // Parallel search: Music + Users
                const [audioResults, userRes] = await Promise.all([
                    audiusService.search(searchQuery),
                    fetch(`${config.API_URL}/api/users/search?q=${encodeURIComponent(searchQuery)}`).then(res => res.json())
                ]);

                setSearchResults(audioResults);
                setUserResults(userRes || []);
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
                <div className="header-actions">
                    <div className="notification-btn" onClick={() => navigate('/messages')}>
                        <MessageCircle size={20} className="header-icon" />
                    </div>
                    <div className="notification-btn" onClick={() => navigate('/notifications')}>
                        <Heart size={20} className="header-icon" />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </div>
                </div>
            </header>

            <main className="explore-content">
                {searchQuery ? (
                    <section className="results-section">
                        {/* Users Search Results */}
                        {userResults.length > 0 && (
                            <div className="users-results-section">
                                <div className="section-header">
                                    <h3>Users</h3>
                                </div>
                                <div className="users-grid">
                                    {userResults.map(user => (
                                        <div key={user._id || user.id} className="user-result-card" onClick={() => navigate(`/profile/${user.username}`)}>
                                            <img
                                                src={getImageUrl(user.avatar)}
                                                alt={user.username}
                                            />
                                            <div className="user-info">
                                                <span className="username">@{user.username}</span>
                                                <span className="name">{user.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Music Results */}
                        <div className="section-header">
                            <Music size={24} />
                            <h3>{loading ? 'Searching...' : `Tracks for "${searchQuery}"`}</h3>
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

                        {!loading && searchResults.length === 0 && userResults.length === 0 && (
                            <p className="no-results">No results found.</p>
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
