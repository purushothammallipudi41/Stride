import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Search, Globe, ArrowUpRight } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Avatar from '../components/common/Avatar';
import './Communities.css';

const Communities = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [communities, setCommunities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/communities`);
                const data = await response.json();
                setCommunities(data);
            } catch (err) {
                console.error('Communities error:', err);
                setError('Failed to load communities. Please check back later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCommunities();
    }, []);

    const filteredCommunities = communities.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) return (
        <div className="discovery-loading">
            <Loader2 className="animate-spin" size={40} />
            <p>Fetching the tribes...</p>
        </div>
    );

    if (error) return (
        <div className="discovery-error glass-panel">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
        </div>
    );

    return (
        <div className="communities-page animate-fade-in">
            <PageHeader 
                title="Communities" 
                rightElement={
                    <button className="create-community-btn text-gradient-bg" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                        <Plus size={16} style={{ marginRight: '4px' }} /> Create
                    </button>
                } 
            />
            <div style={{ padding: '0 16px' }}>
                <p className="page-subtitle" style={{ marginTop: '16px', marginBottom: '24px' }}>Find your tribe and build something amazing together.</p>

            <div className="communities-search glass-panel">
                <Search size={20} className="search-icon" />
                <input 
                    type="text" 
                    placeholder="Search by name or category..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <section className="featured-section">
                <div className="section-header">
                    <h2>Trending Now</h2>
                    <a href="#all" className="view-all">View All</a>
                </div>
                <div className="communities-grid">
                    {filteredCommunities.map(community => (
                        <div key={community.id || community._id} className="community-card glass-panel hover-card">
                            <div className="card-image-v2">
                                <Avatar 
                                    src={community.avatar || community.image} 
                                    alt={community.name} 
                                    size={80} 
                                />
                                {community.category && <span className="category-badge">{community.category}</span>}
                            </div>
                            <div className="card-content">
                                <div className="card-info">
                                    <h3>{community.name}</h3>
                                    <div className="member-count">
                                        <Globe size={14} />
                                        <span>{community.members?.length || community.members || 0} members</span>
                                    </div>
                                </div>
                                <p className="community-desc">{community.description}</p>
                                <div className="card-actions">
                                    <button className="join-btn">Join Tribe</button>
                                    <button className="preview-btn"><ArrowUpRight size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            </div>
        </div>
    );
};


export default Communities;
