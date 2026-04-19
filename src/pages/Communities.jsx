import React, { useState } from 'react';
import { Search, Users, ShieldCheck, Plus, ChevronLeft } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useServer } from '../hooks/useServer';
import { useUI } from '../hooks/useUI';
import './Communities.css';

const Communities = () => {
    const navigate = useNavigate();
    const { servers } = useServer();
    const ui = useUI();
    const openCreateModal = ui?.openCreateModal;
    const [activeTab, setActiveTab] = useState('for-you');
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'for-you', label: 'For You' },
        { id: 'gaming', label: 'Gaming' },
        { id: 'music', label: 'Music' },
        { id: 'tech', label: 'Tech' },
    ];

    const communities = [
        {
            id: 'stride-official',
            name: 'Stride Official',
            description: 'The heartbeat of Stride. News, drops, and community vibes.',
            members: '12.5k',
            category: 'Social',
            verified: true,
            status: 'LIVE',
            image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800'
        },
        {
            id: 'lofi-lounge',
            name: 'Lo-Fi Lounge',
            description: '24/7 chilled beats to study, relax, or code to.',
            members: '8.2k',
            category: 'Music',
            verified: true,
            image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800'
        },
        {
            id: 'neon-gaming',
            name: 'Neon Gaming',
            description: 'Competitive social hub for the next gen of gamers.',
            members: '5.1k',
            category: 'Gaming',
            verified: false,
            image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'
        },
        {
            id: 'crypto-beat',
            name: 'Crypto Beat',
            description: 'Web3, NFTs, and the future of creative decentralized economies.',
            members: '2.4k',
            category: 'Tech',
            verified: false,
            image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800'
        }
    ];

    const filteredCommunities = communities.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'for-you' || c.category.toLowerCase() === activeTab.toLowerCase();
        return matchesSearch && matchesTab;
    });

    return (
        <div className="communities-discover-container animate-fade-in">
            <PageHeader title="Discovery Hub" hideBack={true} />

            <div className="search-filter-section">
                <div style={{ display: 'flex', gap: '12px', marginBottom: '15px' }}>
                    <button 
                        className="back-btn-content animate-scale-in"
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '14px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '56px'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        className="establish-community-btn animate-scale-in"
                        onClick={() => openCreateModal('COMMUNITY')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: 'linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            fontWeight: '900',
                            fontSize: '0.95rem',
                            boxShadow: '0 0 25px var(--theme-primary-glow)',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            textTransform: 'uppercase'
                        }}
                    >
                        <Plus size={20} strokeWidth={3} />
                        <span>Establish New Community</span>
                    </button>
                </div>

                <div className="discover-search-wrapper glass-panel">
                    <Search size={20} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Discover vibes, crews, or clubs..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <nav className="discover-tabs">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            className={`discover-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.id === 'for-you' && <span className="sparkle">✦</span>} {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <main className="discover-content">
                <div className="communities-grid">
                    {filteredCommunities.map(c => (
                        <div key={c.id} className="featured-community-card glass-panel animate-scale-in" onClick={() => navigate(`/community/${c.id}`)}>
                            <div className="community-banner" style={{ backgroundImage: `url(${c.image})` }}>
                                <div className="banner-overlay">
                                    {c.status === 'LIVE' && <div className="live-badge">LIVE</div>}
                                </div>
                            </div>
                            <div className="community-card-info">
                                <div className="community-details">
                                    <div className="name-row">
                                        <h3>{c.name}</h3>
                                        {c.verified && <ShieldCheck size={16} className="verified-icon" />}
                                    </div>
                                    <p>{c.description}</p>
                                    <div className="community-meta">
                                        <div className="meta-item">
                                            <Users size={14} />
                                            <span>{c.members}</span>
                                        </div>
                                        <span className="category-label">{c.category}</span>
                                    </div>
                                </div>
                                <button className="open-community-btn">Explore</button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Communities;
