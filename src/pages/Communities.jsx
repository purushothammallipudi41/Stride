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



    const filteredCommunities = (servers || []).filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'for-you' || (c.category && c.category.toLowerCase() === activeTab.toLowerCase());
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
                    {filteredCommunities.map(c => {
                        const hasBanner = c.bannerUrl || c.imageUrl || c.image;
                        const bannerStyle = hasBanner 
                            ? { backgroundImage: `url(${hasBanner})` }
                            : { background: `linear-gradient(135deg, #1a1a2e 0%, ${c.primaryColor || '#0f0f1a'} 100%)` };

                        return (
                            <div key={c._id || c.id} className="featured-community-card glass-panel animate-scale-in" onClick={() => navigate(`/community/${c._id || c.id}`)}>
                                <div className="community-banner" style={bannerStyle}>
                                    <div className="banner-overlay">
                                        {c.status === 'LIVE' && <div className="live-badge">LIVE</div>}
                                    </div>
                                </div>
                                <div className="community-card-info">
                                    <div className="community-details">
                                        <div className="name-row">
                                            <h3>{c.name}</h3>
                                            {c.isVerified && <ShieldCheck size={16} className="verified-icon" />}
                                        </div>
                                        <p>{c.description || 'No description provided.'}</p>
                                        <div className="community-meta">
                                            <div className="meta-item">
                                                <Users size={14} />
                                                <span>{c.memberCount || c.members?.length || 0}</span>
                                            </div>
                                            <span className="category-label">{c.category || 'Vibe'}</span>
                                        </div>
                                    </div>
                                    <button className="open-community-btn">Explore</button>
                                </div>
                            </div>
                        );
                    })}
                    {filteredCommunities.length === 0 && (
                        <div className="empty-communities-state">
                            <Users size={48} />
                            <p>No matching communities found.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Communities;
