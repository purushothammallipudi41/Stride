import { useState, useEffect } from 'react';
import { Search, User, Hash, ArrowLeft, Play, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { getImageUrl } from '../utils/imageUtils';
import { useContent } from '../context/ContentContext';

const SearchPage = () => {
    const navigate = useNavigate();
    const { posts, fetchPosts } = useContent();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // all, users, channels
    const [userResults, setUserResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPosts();
        fetchSuggestedUsers();
    }, []);

    const fetchSuggestedUsers = async () => {
        try {
            const res = await fetch(`${config.API_URL}/api/users/search?q=`); // Empty query to get default suggestions
            if (res.ok) {
                const data = await res.json();
                setUserResults(data.slice(0, 5));
            }
        } catch (error) {
            console.error('Failed to fetch suggested users:', error);
        }
    };

    useEffect(() => {
        if (!query.trim()) {
            fetchSuggestedUsers(); // Reset to suggestions when query is empty
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

            {/* Content Results */}
            <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                {loading ? (
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Searching...</h3>
                ) : query ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Search Results</h3>
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
                                    onError={(e) => { e.target.src = getImageUrl(null); }}
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
                        {userResults.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                                No users found for "{query}"
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="discovery-section">
                        {/* Suggested Users Section */}
                        {userResults.length > 0 && (
                            <div style={{ marginBottom: '2.5rem' }}>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Suggested Users</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {userResults.map(user => (
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
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <img
                                                src={getImageUrl(user.avatar)}
                                                alt={user.username}
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.src = getImageUrl(null); }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>@{user.username}</div>
                                            </div>
                                            <button className="icon-btn" style={{ padding: '8px' }}>
                                                <User size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Featured Content Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Suggested for You</h3>
                            <button style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>See All</button>
                        </div>

                        {/* 3-Column Discovery Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '2px',
                            margin: '0 -1.5rem'
                        }}>
                            {posts.length > 0 ? posts.slice(0, 21).map((post, idx) => (
                                <div
                                    key={post._id || post.id}
                                    style={{
                                        aspectRatio: '1',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        background: 'rgba(255,255,255,0.05)',
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => navigate('/')}
                                >
                                    {post.type === 'reel' || post.contentUrl?.includes('.mp4') ? (
                                        <div style={{ height: '100%', width: '100%' }}>
                                            <video src={post.contentUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <Film size={16} style={{ position: 'absolute', top: '8px', right: '8px', color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                                        </div>
                                    ) : (
                                        <div style={{ height: '100%', width: '100%' }}>
                                            <img src={post.contentUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                </div>
                            )) : (
                                // Placeholders if no posts
                                [1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }} />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
