import { useState, useEffect } from 'react';
import { Search, Users, Compass, ChevronRight, Hash, Shield, MessageCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import config from '../config';
import './ExploreServers.css';

const CATEGORIES = ['For You', 'All', 'Gaming', 'Music', 'Tech', 'Entertainment', 'Social', 'Other'];

const ExploreServers = () => {
    const { t } = useTranslation();
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('For You');
    const [userVibe, setUserVibe] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchServers();
    }, [activeCategory]);

    const fetchServers = async () => {
        setLoading(true);
        console.log('[ExploreServers] Fetching servers for category:', activeCategory);
        try {
            if (activeCategory === 'For You' && !searchQuery) {
                console.log('[ExploreServers] Fetching AI recommendations...');
                try {
                    const res = await fetch(`${config.API_URL}/api/ai/recommendations`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });

                    console.log('[ExploreServers] Recommendations response status:', res.status);

                    if (res.ok) {
                        const data = await res.json();
                        console.log('[ExploreServers] Recommendations data:', data);
                        setServers(data.recommendations || []);
                        setUserVibe(data.vibe);
                        setLoading(false);
                        return;
                    } else if (res.status === 401) {
                        console.warn('[ExploreServers] Unauthorized for recommendations. Falling back to public servers.');
                    }
                } catch (err) {
                    console.error('[ExploreServers] Recommendations fetch error:', err);
                }

                // Fallback for 401 or fetch error
                console.log('[ExploreServers] Falling back to public explore endpoint...');
                const fallbackRes = await fetch(`${config.API_URL}/api/servers/explore`);
                const fallbackData = await fallbackRes.json();
                setServers(fallbackData || []);
                setLoading(false);
                return;
            }

            const url = new URL(`${config.API_URL}/api/servers/explore`);
            if (activeCategory !== 'All' && activeCategory !== 'For You') url.searchParams.append('category', activeCategory);
            if (searchQuery) url.searchParams.append('q', searchQuery);

            const res = await fetch(url);
            const data = await res.json();
            setServers(data);
            setUserVibe(null);
        } catch (err) {
            console.error("Error fetching public servers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchServers();
    };

    const joinServer = (serverId) => {
        navigate(`/servers/${serverId}`);
    };

    const getCategoryKey = (cat) => {
        const mapping = {
            'For You': 'forYou',
            'All': 'all',
            'Gaming': 'gaming',
            'Music': 'music',
            'Tech': 'tech',
            'Entertainment': 'entertainment',
            'Social': 'social',
            'Other': 'other'
        };
        return mapping[cat] || 'other';
    };

    return (
        <div className="explore-servers-container">
            <header className="explore-header">
                <h1>{t('servers.discoverCommunities')}</h1>
                <p>{t('servers.multiverseSubtitle')}</p>
            </header>

            <div className="explore-controls">
                <form className="explore-search-wrapper" onSubmit={handleSearch}>
                    <Search className="search-icon-fixed" size={20} />
                    <input
                        type="text"
                        placeholder={t('servers.explorePlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>

                <div className="category-tags">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {t(`servers.categories.${getCategoryKey(cat)}`)}
                        </button>
                    ))}
                </div>
            </div>

            {userVibe && (
                <div className="vibe-discovery-banner animate-fade-in">
                    <Sparkles size={20} className="pulse-purple" />
                    <span dangerouslySetInnerHTML={{
                        __html: t('servers.vibeDiscovery', { vibe: userVibe.toUpperCase() })
                    }} />
                </div>
            )}

            <div className="servers-grid">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="server-card skeleton" style={{ height: '300px', background: 'rgba(255,255,255,0.02)' }} />
                    ))
                ) : servers.length > 0 ? (
                    servers.map(server => (
                        <div
                            key={server.id ?? server._id}
                            className="server-card"
                            onClick={() => joinServer(server.id ?? server._id)}
                        >
                            <div className="server-card-banner">
                                <div className="server-card-icon-wrapper">
                                    <img src={getImageUrl(server.icon)} alt={server.name} />
                                </div>
                            </div>
                            <div className="server-card-content">
                                <div className="server-card-header">
                                    <h3>{server.name}</h3>
                                    <div className={`server-pulse-badge ${server.category?.toLowerCase() || 'other'}`}>
                                        <div className="pulse-dot" />
                                        <span>{t('servers.vibeSuffix', { vibe: server.category })}</span>
                                    </div>
                                </div>
                                <p className="server-card-desc">{server.description || t('servers.defaultDescription')}</p>

                                <div className="server-card-meta">
                                    <div className="member-count">
                                        <div className="online-dot" />
                                        <span>{t('servers.communitiesCount', { count: server.members?.length || 0 })}</span>
                                    </div>
                                    <span className="server-category-pill">{t(`servers.categories.${getCategoryKey(server.category)}`)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-discovery">
                        <Compass size={64} style={{ opacity: 0.2, marginBottom: '20px' }} />
                        <h3>{t('servers.noCommunities')}</h3>
                        <p>{t('servers.tryDifferentSearch')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExploreServers;
