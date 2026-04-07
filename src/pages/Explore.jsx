import { useState, useEffect } from 'react';
import SEO from '../components/common/SEO';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useActivity } from '../hooks/useActivity';
import { useTranslation } from 'react-i18next';
import { BASE_URL } from '../utils/api';

import { Search, X, Film, Layers, Music, Trophy } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Avatar from '../components/common/Avatar';
import VerificationBadge from '../components/common/VerificationBadge';
import './Explore.css';

const Explore = () => {
    const navigate = useNavigate();
    const { isUserListening, getUserTrack } = useActivity();
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const urlQuery = searchParams.get('q') || '';
    const [searchQuery, setSearchQuery] = useState(urlQuery);
    const [isSearching, setIsSearching] = useState(!!urlQuery);
    const [discoverPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(!urlQuery);
    const [userResults, setUserResults] = useState([]);
    const [trendingHashtags, setTrendingHashtags] = useState([]);
    const [tagResults, setTagResults] = useState({ posts: [], playlists: [], communities: [] });
    const [recommendedFeed, setRecommendedFeed] = useState({ recommendedTracks: [], trendingCommunities: [] });
    const [vibeLeaderboard, setVibeLeaderboard] = useState([]);



    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/search/trending`);
                const data = await res.json();
                setTrendingHashtags(data.trendingTags || []);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch trending:", err);
                setIsLoading(false);
            }
        };

        const fetchDiscovery = async () => {
            const username = localStorage.getItem('stride_user_username') || 'puru';
            try {
                const res = await fetch(`${BASE_URL}/api/discovery/feed`, {
                    headers: { 'x-user-username': username }
                });
                const data = await res.json();
                setRecommendedFeed(data);
            } catch (err) {
                console.error("Discovery fetch failed:", err);
            }
        };

        fetchTrending();
        fetchDiscovery();

        const fetchLeaderboard = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/communities/leaderboard`);
                const data = await res.json();
                setVibeLeaderboard(data);
            } catch (err) {
                console.error("Leaderboard fetch failed:", err);
            }
        };
        fetchLeaderboard();

        // Listen for real-time leaderboard updates
        const socket = window.socket; // Assuming socket is available globally or via a hook
        if (socket) {
            socket.on('vibe_leaderboard_updated', (data) => {
                setVibeLeaderboard(data);
            });
        }

        return () => {
            if (socket) socket.off('vibe_leaderboard_updated');
        };
    }, []);

    useEffect(() => {
        const query = searchQuery.trim();
        if (!query) {
            setUserResults([]);
            setTagResults({ posts: [], playlists: [], communities: [] });
            return;
        }

        const fetchData = async () => {
            try {
                if (query.startsWith('#')) {
                    const tag = query.substring(1);
                    const res = await fetch(`${BASE_URL}/api/search/tag/${tag}`);
                    const data = await res.json();
                    setTagResults(data || { posts: [], playlists: [], communities: [] });
                } else {
                    const res = await fetch(`${BASE_URL}/api/users/search?q=${query}`);
                    const data = await res.json();
                    setUserResults(data || []);
                }
            } catch (err) {
                console.error("Search error:", err);
            }
        };

        const isInitial = !userResults.length && !tagResults.posts.length;
        const delay = isInitial ? 0 : 300;

        const timeout = setTimeout(fetchData, delay);
        return () => clearTimeout(timeout);
    }, [searchQuery, userResults.length, tagResults.posts.length]);

    // Sync state with URL search param
    useEffect(() => {
        if (urlQuery && urlQuery !== searchQuery) {
            setSearchQuery(urlQuery);
            setIsSearching(true);
        } else if (!isSearching && !searchQuery.trim()) {
            setTagResults({ posts: [], playlists: [], communities: [] });
        }
    }, [urlQuery, searchQuery, isSearching]);


    const handleSearchInput = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (!val.trim()) {
            setUserResults([]);
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            setIsSearching(true);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
    };

    if (isLoading) return <div className="loading-screen">{t('common.loading')}</div>;

    return (
        <div className="explore-container">
            <SEO 
                title={t('nav.explore')} 
                description="Search for artists, hashtags, vibing activity, and trending social communities on Stride." 
            />
            <PageHeader title={t('nav.explore')} />
            <div className="explore-tabs">
                <button className={`explore-tab ${!isSearching && searchQuery === '' ? 'active' : ''}`} onClick={() => setSearchQuery('')}>Trend</button>
                <button className={`explore-tab ${searchQuery === 'vibing' ? 'active' : ''}`} onClick={() => setSearchQuery('vibing')}>Now Vibing</button>
            </div>

            <div className="explore-header-section sticky-search">
                <div className="explore-search-wrapper">
                    <Search size={20} className="search-icon-abs" />
                    <input 
                        type="text" 
                        placeholder={t('explore.search_placeholder')} 
                        value={searchQuery}
                        onChange={handleSearchInput}
                        onKeyDown={handleSearch}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button className="clear-search-btn" onClick={clearSearch} aria-label="Clear Search">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {searchQuery === 'vibing' ? (
                <div className="vibing-activity-container animate-fade-in">
                    <div className="section-header-row">
                        <Music size={24} className="pulse-icon-small" />
                        <h2>STREAMS LIVE NOW</h2>
                    </div>
                    <p className="section-subtitle">Jump into the vibe with other users across the Stride network.</p>
                    
                    <div className="vibing-grid">
                        {/* This would normally be fetched from a global activity API */}
                        {userResults.length > 0 ? (
                            userResults.filter(user => isUserListening(user.username)).map(user => (
                                <div key={user._id} className="vibe-card glass-panel" onClick={() => navigate(`/profile/${user.username}`)}>
                                    <div className="vibe-card-top">
                                        <Avatar 
                                            src={user.avatar} 
                                            alt="" 
                                            size={50} 
                                            frame={user.avatarFrame || 'none'}
                                            isListening={true}
                                        />
                                        <div className="vibe-user-info">
                                            <span className="v-username">{user.username}</span>
                                            <span className="v-detail">Listening to</span>
                                        </div>
                                    </div>
                                    <div className="vibe-track-info">
                                        <div className="v-track-name">{getUserTrack(user.username)?.title || 'Vibing...'}</div>
                                        <div className="v-track-artist">{getUserTrack(user.username)?.artist || 'Audius'}</div>
                                    </div>
                                    <button className="join-vibe-btn">View Profile</button>
                                </div>
                            ))
                        ) : (
                            <div className="empty-vibe-state">
                                <h3>Silence is rare here...</h3>
                                <p>Start listening to music to show up on the map!</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : isSearching || searchQuery ? (
                <div className="search-results-area animate-fade-in">
                    {userResults.length > 0 && (
                        <div className="search-category-section">
                            <h3 className="category-title">{t('explore.people')}</h3>
                            <div className="user-results-list">
                                {userResults.map(user => (
                                    <div key={user._id} className="user-result-card">
                                        <Avatar 
                                            src={user.avatar} 
                                            alt={user.username} 
                                            size={40} 
                                            frame={user.avatarFrame || 'none'}
                                            isListening={isUserListening(user.username)}
                                        />
                                        <div className="user-meta">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span className="user-name">{user.name}</span>
                                                {user.isVerified && <VerificationBadge size={14} />}
                                            </div>
                                            <span className="user-handle">@{user.username}</span>
                                            {isUserListening(user.username) && (
                                                <span className="user-listening-status">Listening to {getUserTrack(user.username)?.title}</span>
                                            )}
                                        </div>
                                        <button className="view-profile-btn" onClick={() => navigate(`/profile/${user.username}`)}>
                                            View
                                        </button>

                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {tagResults.playlists.length > 0 && (
                        <div className="search-category-section">
                            <h3 className="category-title">{t('explore.playlists')}</h3>
                            <div className="user-results-list">
                                {tagResults.playlists.map(p => (
                                    <div key={p._id} className="user-result-card" onClick={() => navigate(`/playlist/${p._id}`)}>
                                        <div className="playlist-icon-box">
                                            <Layers size={20} />
                                        </div>
                                        <div className="user-meta">
                                            <span className="user-name">{p.name}</span>
                                            <span className="user-handle">by {p.owner?.username}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tagResults.communities.length > 0 && (
                        <div className="search-category-section">
                            <h3 className="category-title">{t('explore.communities')}</h3>
                            <div className="user-results-list">
                                {tagResults.communities.map(c => (
                                    <div key={c._id} className="user-result-card" onClick={() => navigate(`/community/${c._id}`)}>
                                        <div className="community-avatar mini">
                                            {c.avatar?.length <= 2 ? c.avatar : <img src={c.avatar} alt={c.name} loading="lazy" />}
                                        </div>
                                        <div className="user-meta">
                                            <span className="user-name">{c.name}</span>
                                            <span className="user-handle">{c.members?.length || 0} members</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {!searchQuery.startsWith('#') && (
                        <div className="search-category-section">
                            <h3 className="category-title">Media</h3>
                            <div className="loading-state">Matching posts and reels...</div>
                        </div>
                    )}

                </div>
            ) : (
                <div className="discovery-area">
                    {vibeLeaderboard?.length > 0 && (
                        <div className="discovery-section vibe-leaderboard-section animate-fade-in">
                            <div className="section-header-row">
                                <Trophy size={20} className="icon-gold" />
                                <h3 className="category-title">GLOBAL VIBE LEADERBOARD</h3>
                            </div>
                            <div className="vibe-leaderboard-grid">
                                {vibeLeaderboard.slice(0, 5).map((community, idx) => (
                                    <div 
                                        key={community._id} 
                                        className="vibe-leaderboard-card glass-panel"
                                        onClick={() => navigate(`/community/${community._id}`)}
                                    >
                                        <div className="vibe-rank">#{idx + 1}</div>
                                        <div className="vibe-card-main">
                                            {!community.avatar || community.avatar.length <= 2 ? (
                                                <div className="vibe-comm-init">{community.avatar || community.name[0]}</div>
                                            ) : (
                                                <img src={community.avatar} alt="" className="vibe-comm-avatar" loading="lazy" />
                                            )}
                                            <div className="vibe-comm-info">
                                                <span className="vibe-comm-name">{community.name}</span>
                                                <span className="vibe-comm-score">{community.vibeScore || 0} Vibe Points</span>
                                            </div>
                                        </div>
                                        <div className="vibe-trend-indicator">🔥 Trending</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {recommendedFeed.trendingCommunities?.length > 0 && (
                        <div className="discovery-section recommended-section animate-fade-in">
                            <div className="section-header-row">
                                <Layers size={20} className="icon-primary" />
                                <h3 className="category-title">RECOMMENDED FOR YOU</h3>
                            </div>
                            <div className="discovery-horizontal-scroll">
                                {recommendedFeed.trendingCommunities.map(community => (
                                    <div 
                                        key={community._id} 
                                        className="discovery-community-card glass-panel"
                                        onClick={() => navigate(`/community/${community._id}`)}
                                    >
                                        <div className="comm-card-banner" style={{ background: community.primaryColor }}>
                                            {community.avatar ? <img src={community.avatar} alt="" loading="lazy" /> : <span>{community.name[0]}</span>}
                                        </div>
                                        <div className="comm-card-info">
                                            <span className="comm-card-name">{community.name}</span>
                                            <span className="comm-card-members">{community.memberCount || 0} members</span>
                                        </div>
                                        <button className="comm-join-btn">Vibe</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="trending-hashtags-section">
                        <h3 className="category-title">{t('explore.trending_hashtags')}</h3>
                        <div className="hashtags-scroll">
                            {trendingHashtags.map(h => (
                                <button 
                                    key={h.tag} 
                                    className="hashtag-chip"
                                    onClick={() => setSearchQuery(h.tag)}
                                >
                                    <span className="hashtag-name">{h.tag}</span>
                                    <span className="hashtag-count">{h.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="instagram-explore-grid">

                        {discoverPosts.map(post => (
                            <div key={post.id} className={`explore-post-item size-${post.size}`}>
                                <img src={post.url} alt="Discover Content" loading="lazy" />
                                {post.type === 'reel' && (
                                    <div className="content-type-icon">
                                        <Film size={20} fill="white" />
                                    </div>
                                )}
                                {post.type === 'image' && post.size === 'large' && (
                                    <div className="content-type-icon">
                                        <Layers size={20} fill="white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Explore;
