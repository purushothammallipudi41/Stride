import React, { useState, useEffect } from 'react';
import { X, Search, ChevronLeft, MoreVertical, MessageCircle, UserPlus, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { BASE_URL } from '../../utils/api';
import './ConnectionsModal.css';

const ConnectionsModal = ({ 
    isOpen, 
    onClose, 
    username, 
    type: initialType = 'followers', 
    followerCount = 0, 
    followingCount = 0, 
    subscriptionCount = 0 
}) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(initialType);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchConnections(activeTab);
        }
    }, [isOpen, activeTab, username]);

    const fetchConnections = async (type) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/profile/${username}/${type}`);
            const data = await res.json();
            if (data.success) {
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error(`Failed to fetch ${type}:`, err);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className={`connections-full-modal ${isOpen ? 'open' : ''}`}>
            <div className="cm-header">
                <button className="cm-back-btn" onClick={onClose}>
                    <ChevronLeft size={28} />
                </button>
                <h2 className="cm-title">{username}</h2>
            </div>

            <div className="cm-tabs">
                <button 
                    className={`cm-tab ${activeTab === 'followers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('followers')}
                >
                    <span>{followerCount} Followers</span>
                </button>
                <button 
                    className={`cm-tab ${activeTab === 'following' ? 'active' : ''}`}
                    onClick={() => setActiveTab('following')}
                >
                    <span>{followingCount} Following</span>
                </button>
                <button 
                    className={`cm-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('subscriptions')}
                >
                    <span>{subscriptionCount} Subscriptions</span>
                </button>
                <div className="cm-tab-indicator" style={{ 
                    left: activeTab === 'followers' ? '0%' : activeTab === 'following' ? '33.3%' : '66.6%' 
                }} />
            </div>

            <div className="cm-content">
                {activeTab === 'followers' && <h3 className="cm-section-title">All followers</h3>}
                
                <div className="cm-list">
                    {isLoading ? (
                        <div className="cm-loading">
                            <div className="spinner" />
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                            <div key={u.username} className="cm-item">
                                <div className={`cm-avatar-ring ${u.hasNewPosts ? 'has-story' : ''}`}>
                                    <Avatar src={u.avatar} size={54} frame={u.avatarFrame} />
                                </div>
                                <div className="cm-info">
                                    <div className="cm-name-row">
                                        <span className="cm-username">{u.username}</span>
                                        {u.isVerified && <div className="cm-verify-badge" />}
                                    </div>
                                    <span className="cm-full-name">{u.name}</span>
                                    {u.hasNewPosts && (
                                        <span className="cm-status">
                                            {u.postCount} new post{u.postCount > 1 ? 's' : ''} <span className="cm-status-dot" />
                                        </span>
                                    )}
                                </div>
                                <div className="cm-actions">
                                    {activeTab === 'following' || (activeTab === 'followers' && u.isFollowing) ? (
                                        <button className="cm-action-btn secondary">Message</button>
                                    ) : (
                                        <button className="cm-action-btn primary">Follow back</button>
                                    )}
                                    <button className="cm-more-btn">
                                        {activeTab === 'followers' ? <X size={20} /> : <MoreVertical size={20} />}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="cm-empty">
                            <p>No results found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConnectionsModal;
