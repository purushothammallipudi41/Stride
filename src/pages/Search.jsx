import { useState, useEffect } from 'react';
import { Search, User, Hash, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { getImageUrl } from '../utils/imageUtils';

const SearchPage = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // all, users, channels
    const [userResults, setUserResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setUserResults([]);
            return;
        }

        const debounce = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`${config.API_URL}/api/users/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setUserResults(data || []);
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounce);
    }, [query]);

    return (
        <div className="page-container" style={{ padding: 0 }}>
            {/* Search Header */}
            <div style={{
                padding: '1.5rem',
                background: 'rgba(20, 20, 30, 0.8)',
                backdropFilter: 'blur(20px)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button onClick={() => navigate(-1)} className="icon-btn">
                        <ArrowLeft size={24} />
                    </button>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <Search size={20} color="var(--text-secondary)" />
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search users, channels..."
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                flex: 1,
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    {['All', 'Users', 'Channels'].map(tab => (
                        <div
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            style={{
                                paddingBottom: '8px',
                                cursor: 'pointer',
                                color: activeTab === tab.toLowerCase() ? 'var(--color-primary)' : 'var(--text-secondary)',
                                borderBottom: activeTab === tab.toLowerCase() ? '2px solid var(--color-primary)' : '2px solid transparent',
                                fontWeight: activeTab === tab.toLowerCase() ? 600 : 400
                            }}
                        >
                            {tab}
                        </div>
                    ))}
                </div>
            </div>

            {/* Results */}
            <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    {loading ? 'Searching...' : (query ? 'Search Results' : 'Suggested')}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(activeTab === 'all' || activeTab === 'users') && userResults.map(user => (
                        <div
                            key={user._id || user.id}
                            onClick={() => navigate(`/profile/${user.username}`)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                padding: '12px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                            <img
                                src={getImageUrl(user.avatar)}
                                alt={user.username}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{user.name}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>@{user.username}</div>
                            </div>
                            <button className="icon-btn">
                                <User size={18} />
                            </button>
                        </div>
                    ))}

                    {!loading && query && userResults.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                            No users found for "{query}"
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
