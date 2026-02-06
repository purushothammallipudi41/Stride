import { useState, useEffect } from 'react';
import config from '../../config';
import { X, Copy, Share, Send, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, title, data, type }) => {
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [sentTo, setSentTo] = useState({});

    useEffect(() => {
        if (isOpen) {
            // Mock fetching friends to DM
            fetch(`${config.API_URL}/api/users`)
                .then(res => res.json())
                .then(data => setUsers(data.slice(0, 5))) // Just get first 5 for demo
                .catch(err => console.error("Failed to load users", err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const shareUrl = `${window.location.origin}/${type}/${data.id}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out this ${type}`,
                    text: data.title || data.username,
                    url: shareUrl
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            alert('Native sharing not supported on this device');
        }
    };

    const handleSendDM = (user) => {
        // Mock sending DM
        // In real app: await sendMessage(user.id, { type: 'share', content: data });
        setSentTo(prev => ({ ...prev, [user.id]: true }));
        console.log(`Shared ${type} with ${user.username}`);
    };

    return createPortal(
        <div className="share-modal-overlay animate-fade-in" onClick={onClose}>
            <div className="share-modal-content glass-card" onClick={e => e.stopPropagation()}>
                <div className="share-header">
                    <h3>Share {type === 'profile' ? 'Profile' : 'Song'}</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="share-preview">
                    {type === 'profile' ? (
                        <div className="preview-card-profile">
                            <div className="preview-avatar" style={{ backgroundImage: `url(${data.image})` }}></div>
                            <div className="preview-info">
                                <h4>{data.title}</h4>
                                <p>@{data.subtitle}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="preview-card-music">
                            <img src={data.image} alt="Art" className="preview-art" />
                            <div className="preview-info">
                                <h4>{data.title}</h4>
                                <p>{data.subtitle}</p>
                            </div>
                        </div>
                    )}
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
                    <h4>Send to</h4>
                    <div className="dm-list premium-scrollbar">
                        {users.map(user => (
                            <div key={user.id} className="dm-user-item">
                                <div className="dm-user-info">
                                    <div className="dm-avatar" style={{ backgroundImage: `url(${user.avatar})` }}></div>
                                    <span>{user.username}</span>
                                </div>
                                <button
                                    className={`dm-send-btn ${sentTo[user.id] ? 'sent' : ''}`}
                                    onClick={() => handleSendDM(user)}
                                    disabled={sentTo[user.id]}
                                >
                                    {sentTo[user.id] ? 'Sent' : 'Send'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ShareModal;
