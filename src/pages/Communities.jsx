import React, { useState } from 'react';
import { ChevronLeft, Search, Users, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useServer } from '../hooks/useServer';
import './Communities.css';

const Communities = () => {
    const navigate = useNavigate();
    const { servers } = useServer();
    const [activeTab, setActiveTab] = useState('for-you');
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'for-you', label: 'For You' },
        { id: 'all', label: 'All' },
        { id: 'gaming', label: 'Gaming' },
        { id: 'music', label: 'Music' },
        { id: 'tech', label: 'Tech' },
    ];

    // Try to find the real Stride Official community from the backend
    const officialServer = servers.find(s => s.name === 'Stride Official') || servers[0];

    const featuredCommunity = {
        id: officialServer?._id || 'stride-official',
        name: officialServer?.name || 'Stride Official',
        description: officialServer?.description || 'A community on Stride',
        members: officialServer?.memberCount || officialServer?.members?.length || 0,
        category: 'Social',
        verified: true,
        image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&auto=format&fit=crop&q=60'
    };

    const handleOpenCommunity = () => {
        if (featuredCommunity.id) {
            navigate(`/community/${featuredCommunity.id}`);
        }
    };

    return (
        <div className="communities-discover-container animate-fade-in">
            <header className="discover-header">
                <button className="back-btn-icon" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <div className="title-group">
                    <h1>Discover Communities</h1>
                    <p>Find and join vibrant servers on Stride</p>
                </div>
            </header>

            <div className="search-filter-section">
                <div className="discover-search-wrapper">
                    <Search size={20} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search communities..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                <div className="featured-community-card glass-panel">
                    <div className="community-banner" style={{ backgroundImage: `url(${featuredCommunity.image})` }}>
                        <div className="banner-overlay"></div>
                    </div>
                    <div className="community-card-info">
                        <div className="community-avatar-large">
                            <Users size={32} />
                        </div>
                        <div className="community-details">
                            <div className="name-row">
                                <h3>{featuredCommunity.name}</h3>
                                {featuredCommunity.verified && <ShieldCheck size={18} className="verified-icon" />}
                            </div>
                            <p>{featuredCommunity.description}</p>
                            <div className="community-meta">
                                <div className="meta-item">
                                    <div className="online-dot"></div>
                                    <span>{featuredCommunity.members} members</span>
                                </div>
                                <span className="category-label">{featuredCommunity.category}</span>
                            </div>
                        </div>
                        <button className="open-community-btn" onClick={handleOpenCommunity}>Open</button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Communities;
