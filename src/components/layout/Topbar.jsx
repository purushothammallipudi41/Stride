import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Heart, Search, Users, BadgeCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../hooks/useUI';
import NotificationCenter from '../social/NotificationCenter';
import logo from '../../assets/stride-logo.png';
import { BASE_URL } from '../../utils/api';
import './Topbar.css';

const Topbar = () => {
    const navigate = useNavigate();
    const { unreadNotifications, unreadMessages } = useUI();
    const [showNotifPopover, setShowNotifPopover] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchResults(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSearchResults(null);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(val)}`);
            const data = await res.json();
            setSearchResults(data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    const navigateTo = (path) => {
        navigate(path);
        setSearchResults(null);
        setSearchQuery('');
    };

    return (
        <header className="topbar">
            <div className="topbar-logo-section" onClick={() => navigate('/')}>
                <img src={logo} alt="Stride" className="topbar-logo" />
                <span className="topbar-logo-text">Stride</span>
            </div>

            <div className="topbar-search-container" ref={searchRef}>
                <div className="topbar-search-wrapper">
                    <Search className="search-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search artists, communities..." 
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => {setSearchQuery(''); setSearchResults(null);}}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {searchResults && (
                    <div className="search-dropdown-v2 glass-panel animate-fade-in-up">
                        {searchResults.artists.length > 0 && (
                            <div className="search-section">
                                <span className="section-label">Artists</span>
                                {searchResults.artists.map(u => (
                                    <div key={u.username} className="search-item" onClick={() => navigateTo(`/profile/${u.username}`)}>
                                        <img src={u.avatar} alt="" className="item-avatar" />
                                        <span className="item-name">@{u.username}</span>
                                        {u.isVerified && <BadgeCheck size={14} fill="var(--theme-primary)" color="white" />}
                                    </div>
                                ))}
                            </div>
                        )}
                        {searchResults.communities.length > 0 && (
                            <div className="search-section">
                                <span className="section-label">Communities</span>
                                {searchResults.communities.map(c => (
                                    <div key={c.id} className="search-item" onClick={() => navigateTo(`/community/${c.id}`)}>
                                        <div className="item-avatar community-icon"><Users size={16} /></div>
                                        <span className="item-name">{c.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {searchResults.artists.length === 0 && searchResults.communities.length === 0 && (
                            <div className="search-no-results">No frequencies found matching "{searchQuery}"</div>
                        )}
                    </div>
                )}
            </div>

            <div className="topbar-actions">
                <div style={{ position: 'relative' }}>
                    <button 
                        className={`topbar-btn ${showNotifPopover ? 'active' : ''}`}
                        onClick={() => {
                            if (window.innerWidth < 768) {
                                navigate('/notifications');
                            } else {
                                setShowNotifPopover(!showNotifPopover);
                            }
                        }}
                        aria-label="Notifications"
                    >
                        <Heart size={24} />
                        {unreadNotifications > 0 && <span className="notification-badge-v2">{unreadNotifications}</span>}
                    </button>
                    <NotificationCenter 
                        isOpen={showNotifPopover} 
                        onClose={() => setShowNotifPopover(false)} 
                    />
                </div>
                <button 
                    className="topbar-btn"
                    onClick={() => navigate('/messages')}
                    aria-label="Direct Messages"
                >
                    <MessageCircle size={24} />
                    {unreadMessages > 0 && <span className="notification-badge-v2">{unreadMessages}</span>}
                </button>
            </div>
        </header>
    );
};


export default Topbar;
