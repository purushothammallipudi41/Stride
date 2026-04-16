import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Hash, TrendingUp, Music2, Film, Radio, Globe, Users, Layout, Music, Trophy, BarChart3, Wallet, ShoppingBag, Settings, LogOut } from 'lucide-react';
import { useUI } from '../hooks/useUI';
import GlobalModal from './common/GlobalModal';
import Avatar from './common/Avatar';
import { BASE_URL } from '../utils/api';

const ExploreModal = () => {
    const navigate = useNavigate();
    const { isExplorerOpen, closeExplorer, openVault } = useUI();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    if (!isExplorerOpen) return null;

    const trendingTags = ['music', 'lofi', 'beats', 'crypto', 'nft', 'gaming', 'fashion'];

    const mainItems = [
        { id: 'reels', icon: Film, label: 'Reels', path: '/reels' },
        { id: 'spaces', icon: Radio, label: 'Spaces', path: '/servers' },
        { id: 'articles', icon: Globe, label: 'Articles', path: '/articles' },
        { id: 'communities', icon: Users, label: 'Communities', path: '/communities/discover' },
        { id: 'dashboard', icon: Layout, label: 'Dashboard', path: '/artist-dashboard' },
        { id: 'music', icon: Music, label: 'Music House', path: '/music' },
        { id: 'achievements', icon: Trophy, label: 'Achievements', path: '/achievements' },
        { id: 'insights', icon: BarChart3, label: 'Insights', path: '/insights' },
        { id: 'vault', icon: Wallet, label: 'Creator Vault', action: openVault },
        { id: 'marketplace', icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    ];

    const handleItemClick = (item) => {
        if (item.action) {
            item.action();
        } else if (item.path !== '#') {
            navigate(item.path);
            closeExplorer();
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setResults(null);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`${BASE_URL}/api/search?q=${query}`);
            const data = await res.json();
            setResults(data);
            setIsSearching(false);
        } catch (err) {
            console.error("Search failed:", err);
            setIsSearching(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
        closeExplorer();
    };

    return (
        <GlobalModal 
            isOpen={isExplorerOpen} 
            onClose={closeExplorer}
            showClose={true}
            maxWidth="500px"
            className="explore-standardized"
        >
            <div className="explore-header">
                <h1 className="explore-title">Explore <span className="text-gradient">Stride</span></h1>
                
                <div className="search-bar-v2 glass-card">
                    <Search size={20} className="search-icon-v2" />
                    <input 
                        type="text" 
                        placeholder="Search vibes, tags, or tracks..." 
                        className="search-input-v2"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        autoFocus
                    />
                    {isSearching && <div className="search-loader-v2"></div>}
                </div>
            </div>

            {results ? (
                <div className="search-results-v2 animate-fade-in">
                    {/* Tags Results */}
                    <div className="results-section-v2">
                        <h4>TRENDING VIBES</h4>
                        <div className="tags-row-v2">
                            {trendingTags.map(tag => (
                                <button key={tag} className="tag-pill-v2" onClick={() => handleSearch(tag)}>
                                    <Hash size={14} /> {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Users Results */}
                    {results.users?.length > 0 && (
                        <div className="results-section-v2">
                            <h4>PEOPLE</h4>
                            <div className="results-list-v2">
                                {results.users.map(u => (
                                    <div key={u.username} className="result-item-v2" onClick={() => handleItemClick({ path: `/profile/${u.username}` })}>
                                        <Avatar src={u.avatar} size={40} frame={u.avatarFrame} />
                                        <div className="result-info-v2">
                                            <span className="result-username">{u.username}</span>
                                            <span className="result-subtitle">{u.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Communities Results */}
                    {results.communities?.length > 0 && (
                        <div className="results-section-v2">
                            <h4>COMMUNITIES</h4>
                            <div className="results-list-v2">
                                {results.communities.map(c => (
                                    <div key={c._id} className="result-item-v2" onClick={() => handleItemClick({ path: `/communities/${c._id}` })}>
                                        <div className="community-icon-v2 glass-panel">
                                            <Music2 size={24} />
                                        </div>
                                        <div className="result-info-v2">
                                            <span className="result-username">{c.name}</span>
                                            <span className="result-subtitle">{c.memberCount} members</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <button className="view-all-results-btn" onClick={() => handleItemClick({ path: `/explore?q=${searchQuery}` })}>
                        View all results for "{searchQuery}"
                    </button>
                </div>
            ) : (
                <>
                    <div className="explore-hero-card" onClick={() => handleItemClick({ path: '/explore' })}>
                        <div className="hero-icon-wrapper">
                            <TrendingUp size={32} className="hero-sparkle" />
                        </div>
                        <div className="hero-info">
                            <h3>Trending Now</h3>
                            <p>Discover the top rhythms</p>
                        </div>
                        <div className="hero-dot"></div>
                    </div>

                    <div className="explore-grid">
                        {mainItems.map((item) => (
                            <div key={item.id} className="explore-item-card" onClick={() => handleItemClick(item)}>
                                <div className="item-icon-wrapper">
                                    <item.icon size={24} />
                                </div>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className="explore-footer">
                <div className="explore-item-card settings" onClick={() => handleItemClick({ path: '/settings' })}>
                    <div className="item-icon-wrapper">
                        <Settings size={24} />
                    </div>
                    <span>Settings</span>
                </div>
                <div className="explore-item-card logout" onClick={handleLogout}>
                    <div className="item-icon-wrapper">
                        <LogOut size={24} />
                    </div>
                    <span>Logout</span>
                </div>
            </div>
        </GlobalModal>
    );
};

export default ExploreModal;
