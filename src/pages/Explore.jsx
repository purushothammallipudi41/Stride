import { useState, useEffect } from 'react';
import { Search, Music, Play, TrendingUp, Share2, User, Heart, MessageCircle, Sparkles, Hash } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { audiusService } from '../services/audiusService';
import { useMusic } from '../context/MusicContext';
import { useTranslation } from 'react-i18next';
import ShareModal from '../components/common/ShareModal';
import VibeMatchModal from '../components/explore/VibeMatchModal';
import SmartDJ from '../components/explore/SmartDJ';
import config from '../config';
import { getImageUrl } from '../utils/imageUtils';
import UserAvatar from '../components/common/UserAvatar';
import './Explore.css';

const Explore = () => {
    const { t } = useTranslation();
    const { playTrack, currentTrack, isPlaying } = useMusic();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [userResults, setUserResults] = useState([]);
    const [trending, setTrending] = useState([]);
    const [trendingHashtags, setTrendingHashtags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingTrending, setLoadingTrending] = useState(true);
    const [shareData, setShareData] = useState(null);
    const [vibeModalOpen, setVibeModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('trending');
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);

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

        // Fetch trending hashtags
        const fetchHashtags = async () => {
            try {
                const res = await fetch(`${config.API_URL}/api/analytics/trending/hashtags`);
                if (res.ok) {
                    const data = await res.json();
                    setTrendingHashtags(data.slice(0, 8));
                }
            } catch (e) {
                console.error('[TRENDING HASHTAGS]', e);
            }
        };
        fetchHashtags();
    }, []);

    useEffect(() => {
        if (activeTab === 'trending') return;

        const fetchRecommendations = async () => {
            setLoadingRecs(true);
            try {
                const res = await fetch(`${config.API_URL}/api/feed/foryou`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                if (data && !data.error) setRecommendations(data);
            } catch (error) {
                console.error('Failed to fetch recommendations:', error);
            } finally {
                setLoadingRecs(false);
            }
        };

        if (activeTab === 'foryou') fetchRecommendations();
    }, [activeTab]);

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
            </header>

            {!searchQuery && (
                <div className="explore-tabs">
                    <button
                        className={`explore-tab ${activeTab === 'trending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('trending')}
                    >
                        <TrendingUp size={18} />
                        <span>Trending</span>
                    </button>
                    <button
                        className={`explore-tab ${activeTab === 'foryou' ? 'active' : ''}`}
                        onClick={() => setActiveTab('foryou')}
                    >
                        <Sparkles size={18} />
                        <span>For You</span>
                    </button>
                </div>
            )}

            <main className="explore-content">
                {/* Trending Hashtags Strip */}
                {!searchQuery && trendingHashtags.length > 0 && (
                    <div className="explore-hashtag-strip" id="explore-hashtag-strip">
                        <div className="explore-hashtag-strip-header">
                            <span>🔥</span>
                            <span>{t('explore.trendingNow')}</span>
                        </div>
                        <div className="explore-hashtag-chips">
                            {trendingHashtags.map((item, idx) => (
                                <button
                                    key={item.tag}
                                    className="explore-hashtag-chip"
                                    onClick={() => navigate(`/hashtag/${item.tag}`)}
                                    id={`hashtag-chip-${item.tag}`}
                                >
                                    <Hash size={12} />
                                    <span>{item.tag}</span>
                                    <span className="explore-hashtag-count">{item.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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
                                            <UserAvatar user={user} size="sm" />
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
                            {activeTab === 'trending' ? (
                                <>
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
                                </>
                            ) : (
                                <>
                                    <div className="section-header">
                                        <Sparkles size={24} />
                                        <h3>For You</h3>
                                    </div>
                                    {loadingRecs ? (
                                        <div className="flex-center" style={{ padding: '40px' }}>
                                            <div className="loading-spinner"></div>
                                        </div>
                                    ) : recommendations.length > 0 ? (
                                        <div className="tracks-grid">
                                            {recommendations.map(server => (
                                                <div key={server.id} className="server-recommendation-card" onClick={() => navigate(`/servers/${server.id}`)}>
                                                    <div className="rec-image-wrap">
                                                        <img src={getImageUrl(server.icon, 'server')} alt={server.name} />
                                                        {server.aiTags && (
                                                            <div className="ai-tags">
                                                                {server.aiTags.slice(0, 2).map(tag => <span key={tag} className="ai-tag">#{tag}</span>)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="rec-content">
                                                        <h4>{server.name}</h4>
                                                        <p>{server.description}</p>
                                                        <div className="rec-footer">
                                                            <span className="member-count">{server.members?.length || 0} members</span>
                                                            <button className="join-btn">View Server</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-recs">
                                            <p>No recommendations yet. Interact more to personalize your feed!</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </>
                )}
            </main>

            {shareData && (
                <ShareModal
                    isOpen={true}
                    onClose={() => setShareData(null)}
                    data={shareData}
                />
            )}

            <VibeMatchModal
                isOpen={vibeModalOpen}
                onClose={() => setVibeModalOpen(false)}
            />
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
