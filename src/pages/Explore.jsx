import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Search, X, Film, Layers } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import './Explore.css';

const Explore = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const [isSearching, setIsSearching] = useState(false);
    const [discoverPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userResults, setUserResults] = useState([]);
    const [trendingHashtags, setTrendingHashtags] = useState([]);
    const [tagResults, setTagResults] = useState({ posts: [], playlists: [], communities: [] });



    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/search/trending`);
                const data = await res.json();
                setTrendingHashtags(data.trendingTags || []);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch trending:", err);
                setIsLoading(false);
            }
        };
        fetchTrending();
    }, []);

    useEffect(() => {
        const query = searchQuery.trim();
        if (!query) {
            const timer = setTimeout(() => {
                setUserResults([]);
                setTagResults({ posts: [], playlists: [], communities: [] });
            }, 0);
            return () => clearTimeout(timer);
        }

        
        const fetchData = async () => {
            try {
                if (query.startsWith('#')) {
                    const tag = query.substring(1);
                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/search/tag/${tag}`);
                    const data = await res.json();
                    setTagResults(data);
                } else {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/search?q=${query}`);
                    const data = await res.json();
                    setUserResults(data);
                }
            } catch (err) {
                console.error("Search error:", err);
            }
        };

        const timeout = setTimeout(fetchData, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);


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

    if (isLoading) return <div className="loading-screen">Scoping the scene...</div>;

    return (
        <div className="explore-container">
            <PageHeader title="Discover" />
            <header className="explore-header-section">
                <div className="explore-search-wrapper">
                    <Search size={20} className="search-icon-abs" />
                    <input 
                        type="text" 
                        placeholder="Search for posts, reels, or people..." 
                        value={searchQuery}
                        onChange={handleSearchInput}
                        onKeyDown={handleSearch}
                    />
                    {searchQuery && (
                        <button className="clear-search-btn" onClick={clearSearch}>
                            <X size={18} />
                        </button>
                    )}
                </div>
            </header>

            {isSearching || searchQuery ? (
                <div className="search-results-area animate-fade-in">
                    {userResults.length > 0 && (
                        <div className="search-category-section">
                            <h3 className="category-title">People</h3>
                            <div className="user-results-list">
                                {userResults.map(user => (
                                    <div key={user._id} className="user-result-card">
                                        <div className="user-avatar-wrapper">
                                            <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.username}`} alt={user.username} />
                                        </div>
                                        <div className="user-meta">
                                            <span className="user-name">{user.name}</span>
                                            <span className="user-handle">@{user.username}</span>
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
                            <h3 className="category-title">Playlists</h3>
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
                            <h3 className="category-title">Communities</h3>
                            <div className="user-results-list">
                                {tagResults.communities.map(c => (
                                    <div key={c._id} className="user-result-card" onClick={() => navigate(`/community/${c._id}`)}>
                                        <div className="community-avatar mini">
                                            {c.avatar?.length <= 2 ? c.avatar : <img src={c.avatar} alt={c.name} />}
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
                    <div className="trending-hashtags-section">
                        <h3 className="category-title">Trending Hashtags</h3>
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
