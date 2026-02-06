import { useState, useEffect } from 'react';
import { Search, User, Hash, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchPage = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // all, users, channels
    const [mockUsers, setMockUsers] = useState([]);

    useEffect(() => {
        // Mock data fetch
        const users = [
            { id: 1, name: 'alex_beats', username: '@alex_beats', avatar: 'https://i.pravatar.cc/150?u=alex_beats', status: 'online' },
            { id: 2, name: 'sarah_j', username: '@sarah_j', avatar: 'https://i.pravatar.cc/150?u=sarah_j', status: 'idle' },
            { id: 3, name: 'lofi_lover', username: '@lofi_lover', avatar: 'https://i.pravatar.cc/150?u=lofi', status: 'dnd' },
            { id: 4, name: 'mike_drop', username: '@mike_drop', avatar: 'https://i.pravatar.cc/150?u=mike', status: 'offline' },
            { id: 5, name: 'beat_maker', username: '@beat_maker', avatar: 'https://i.pravatar.cc/150?u=beat', status: 'offline' }
        ];
        setMockUsers(users);
    }, []);

    const filteredUsers = mockUsers.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase())
    );

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
                    {query ? 'Search Results' : 'Suggested'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            onClick={() => navigate(`/profile/${user.username.replace('@', '')}`)}
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
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundImage: `url(${user.avatar})`,
                                    backgroundSize: 'cover'
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    border: '2px solid #1e1e2f',
                                    background: user.status === 'online' ? '#10b981' : user.status === 'idle' ? '#f59e0b' : '#6b7280'
                                }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{user.name}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.username}</div>
                            </div>
                            <button className="icon-btn">
                                <User size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
