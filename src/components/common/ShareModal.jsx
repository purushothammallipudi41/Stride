import { useState, useEffect } from 'react';
import config from '../../config';
import { X, Copy, Share, Send, Check, Search } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../context/AuthContext';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, data, type }) => {
    const { user: currentUser } = useAuth();
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [sentTo, setSentTo] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers('');
        }
    }, [isOpen]);

    const fetchUsers = async (query) => {
        setLoading(true);
        try {
            const endpoint = query
                ? `${config.API_URL}/api/users/search?q=${encodeURIComponent(query)}`
                : `${config.API_URL}/api/users`;
            const res = await fetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                // Filter out current user from sharing list
                setUsers(data.filter(u => u.email !== currentUser?.email));
            }
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) fetchUsers(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    if (!isOpen) return null;

    // Build correct preview data based on type
    const previewData = type === 'story' ? {
        id: data.id,
        title: `${data.username}'s Story`,
        subtitle: 'Story',
        image: data.content
    } : type === 'profile' ? {
        id: data.id || data.username,
        title: data.name,
        subtitle: data.username,
        image: data.image || getImageUrl(data.avatar, 'user') || getImageUrl(data.username, 'user')
    } : data; // Default for song which already has correct format

    const shareUrl = `${window.location.origin}/${type}/${previewData.id}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out this on Stride`,
                    text: previewData.title,
                    url: shareUrl
                });
            } catch (err) {
                // Error sharing
            }
        } else {
            handleCopy();
            alert('Link copied to clipboard!');
        }
    };

    const handleSendDM = async (targetUser) => {
        try {
            const res = await fetch(`${config.API_URL}/api/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: currentUser.email,
                    to: targetUser.email,
                    text: `Shared a ${type}: ${previewData.title}`,
                    sharedContent: {
                        type,
                        id: previewData.id,
                        thumbnail: previewData.image,
                        title: previewData.title
                    }
                })
            });
            if (res.ok) {
                setSentTo(prev => ({ ...prev, [targetUser._id || targetUser.id]: true }));
            }
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };

    return createPortal(
        <div className="share-modal-overlay animate-fade-in" onClick={onClose}>
            <div className="share-modal-content glass-card" onClick={e => e.stopPropagation()}>
                <div className="share-header">
                    <h3>Share {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Content'}</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="share-preview">
                    <div className="preview-card-item">
                        <img src={getImageUrl(previewData.image)} alt="Preview" className="preview-art"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = previewData.image; // Fallback to raw if logic fails
                            }}
                        />
                        <div className="preview-info">
                            <h4>{previewData.title}</h4>
                            <p>{previewData.subtitle}</p>
                        </div>
                    </div>
                </div>

                <div className="share-options">
                    <button className="share-option-btn" onClick={handleCopy}>
                        {copied ? <Check size={20} /> : <Copy size={20} />}
                        <span>{copied ? 'Copied' : 'Copy Link'}</span>
                    </button>
                    <button className="share-option-btn" onClick={handleShareNative}>
                        <Share size={20} />
                        <span>Share via...</span>
                    </button>
                </div>

                <div className="dm-section">
                    <div className="dm-search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search users to send to..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="dm-list premium-scrollbar">
                        {loading && <div className="dm-loading"><div className="spinner small"></div></div>}
                        {!loading && users.map(u => (
                            <div key={u._id || u.id} className="dm-user-item">
                                <div className="dm-user-info">
                                    <div className="dm-avatar" style={{ backgroundImage: `url(${getImageUrl(u.avatar, 'user')})` }}></div>
                                    <div className="dm-text-info">
                                        <span className="dm-username">@{u.username}</span>
                                        <span className="dm-name">{u.name}</span>
                                    </div>
                                </div>
                                <button
                                    className={`dm-send-btn ${sentTo[u._id || u.id] ? 'sent' : ''}`}
                                    onClick={() => handleSendDM(u)}
                                    disabled={sentTo[u._id || u.id]}
                                >
                                    {sentTo[u._id || u.id] ? <Check size={16} /> : 'Send'}
                                </button>
                            </div>
                        ))}
                        {!loading && users.length === 0 && <p className="no-users">No users found.</p>}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ShareModal;
