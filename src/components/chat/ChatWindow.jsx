import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Video, Image as ImageIcon, ChevronLeft, Mic, Plus, Smile as SmileIcon, Camera, MessageSquare } from 'lucide-react';
import socket from '../../services/socket';
import Avatar from '../common/Avatar';
import VerificationBadge from '../common/VerificationBadge';
import './Chat.css';

const ChatWindow = ({ activeChat, onSendMessage, onStartCall, roomId, currentUser, onBack, isDisabled, hideCallButtons, typingUsers }) => {
    const [msgText, setMsgText] = useState('');
    const [showGifs, setShowGifs] = useState(false);
    const [isGifMode, setIsGifMode] = useState(false);
    const [gifSearch, setGifSearch] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeChat?.messages]);

    useEffect(() => {
        if (!roomId || !currentUser) return;

        if (activeChat?.messages?.length > 0) {
            const lastMsg = activeChat.messages[activeChat.messages.length - 1];
            socket.emit('message_seen', { roomId, messageId: lastMsg.id, username: currentUser });
        }
    }, [roomId, currentUser, activeChat?.messages]);

    const handleInputChange = (e) => {
        setMsgText(e.target.value);
    };

    const handleSendText = () => {
        if (msgText.trim()) {
            onSendMessage(msgText, 'text');
            setMsgText('');
        }
    };

    const handlePlusClick = () => {
        setShowGifs(!showGifs);
    };

    const handleCameraClick = () => {
        cameraInputRef.current?.click();
    };

    const handleLocationClick = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            // Send the special token format that the Stride Map Engine expects
            onSendMessage(`[LOCATION:${latitude},${longitude}]`, 'location');
            setShowGifs(false);
        }, () => {
            alert("Unable to retrieve your location. Please check permissions.");
        });
    };

    const handleGalleryClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onSendMessage(`Sent a photo: ${file.name}`, 'image');
        }
    };

    const handleMicClick = () => {
        alert("Voice messages are enabled for your account. Hold to record.");
    };

    if (!activeChat) {
        return (
            <div className="chat-window-v3">
                <div className="empty-chat-placeholder glass-panel">
                    <div className="empty-chat-icon-glow">
                        <MessageSquare size={48} className="text-white" />
                    </div>
                    <h3>Your Messages</h3>
                    <p>Send a private photo or message to a friend.</p>
                    <button className="chat-tab active" style={{ marginTop: '20px', padding: '12px 30px' }}>
                        Send Message
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`chat-window-v3 animate-fade-in ${isDisabled ? 'disabled' : ''}`}>
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileChange}
            />
            <input 
                type="file" 
                ref={cameraInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
            />

            <div className="chat-header-glass">
                <div className="chat-header-left">
                    <button 
                        className="chat-back-btn" 
                        onClick={onBack} 
                        aria-label="Go back"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="chat-avatar-ring">
                        <Avatar 
                            src={activeChat.avatar} 
                            alt="Avatar" 
                            size={38} 
                            frame={activeChat.avatarFrame || 'none'}
                        />
                    </div>
                    <div className="chat-header-info">
                        <div className="chat-header-name-row">
                            <span className="chat-header-name">{activeChat.name || activeChat.username}</span>
                            {activeChat.isVerified && <VerificationBadge size={14} />}
                        </div>
                        <span className="chat-header-status">{typingUsers?.has(activeChat.username) ? <span className="text-gradient">typing...</span> : 'Active now'}</span>
                    </div>
                </div>
                {!hideCallButtons && (
                    <div className="chat-header-right">
                        <button className="chat-icon-btn glow" onClick={() => onStartCall && onStartCall('audio')} aria-label="Audio Call">
                            <Phone size={20} />
                        </button>
                        <button className="chat-icon-btn glow" onClick={() => onStartCall && onStartCall('video')} aria-label="Video Call">
                            <Video size={20} />
                        </button>
                    </div>
                )}
            </div>

            <div className="chat-messages-container">
                <div className="chat-messages-v2">
                    {activeChat.messages.map((msg, index) => {
                        const isLastInGroup = index === activeChat.messages.length - 1 || activeChat.messages[index + 1].username !== msg.username;
                        return (
                            <div key={msg.id || index} className={`message-v2 ${msg.isMe ? 'me' : 'them'}`}>
                                <div className="message-content">
                                    <div className="message-bubble-v2">
                                        {msg.text && msg.text.includes('[LOCATION:') ? (
                                            (() => {
                                                // Robust regex for coordinates (handles decimals and integers)
                                                const match = msg.text.match(/\[LOCATION:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\]/);
                                                if (match) {
                                                    const lat = parseFloat(match[1]);
                                                    const lon = parseFloat(match[2]);
                                                    // Calculate a stable bbox for the shared point
                                                    const offset = 0.005;
                                                    const bbox = [lon - offset, lat - offset, lon + offset, lat + offset].join('%2C');
                                                    
                                                    return (
                                                        <div className="stride-map-placeholder-pre" onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank')}>
                                                            <div className="stride-map-header">
                                                                <span className="stride-map-badge">STRIDE MAPS ENGINE v2</span>
                                                            </div>
                                                            <div className="stride-map-preview-static">
                                                                <iframe 
                                                                    className="stride-map-iframe"
                                                                    title="Stride Location"
                                                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`}
                                                                    onLoad={(e) => console.log('SocialAction: Map rendered')}
                                                                />
                                                            </div>
                                                            <div className="stride-map-footer">
                                                                Shared Location
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return msg.text;
                                            })()
                                        ) : msg.type === 'gif' || (msg.text && (msg.text.includes('giphy.com') || msg.text.includes('.gif') || msg.text.includes('media.giphy.com'))) ? (
                                            <div className="message-media-wrapper">
                                                <img 
                                                    src={msg.text} 
                                                    alt="GIF" 
                                                    className="message-gif-media" 
                                                    onLoad={(e) => e.target.classList.add('loaded')}
                                                    onError={(e) => {
                                                        console.error("GIF failed to load:", msg.text);
                                                        e.target.src = "https://via.placeholder.com/200x200?text=GIF+Error";
                                                    }}
                                                />
                                            </div>
                                        ) : msg.type === 'image' ? (
                                            <img src={msg.text} alt="Shared Photo" className="message-image-media" />
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                    {isLastInGroup && (
                                        <div className="message-status-v2">
                                            {msg.isMe ? (msg.readStatus ? 'Seen' : 'Sent') : msg.time}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {showGifs && createPortal(
                <>
                    <div className="action-sheet-backdrop" onClick={() => { setShowGifs(false); setIsGifMode(false); }} />
                    <div className="action-sheet-container animate-sheet-up" onClick={(e) => e.stopPropagation()}>
                        <div className="action-sheet-handle" />
                        
                        {isGifMode ? (
                            <div className="gif-picker-content">
                                <div className="gif-picker-header">
                                    <button className="gif-back-btn" onClick={() => setIsGifMode(false)}><ChevronLeft size={20} /></button>
                                    <input 
                                        type="text" 
                                        placeholder="Search GIFs..." 
                                        className="gif-search-input"
                                        value={gifSearch}
                                        onChange={(e) => setGifSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="gif-results-grid">
                                    {[
                                        "https://media.giphy.com/media/l41lTfO7K8W4N2EaE/giphy.gif",
                                        "https://media.giphy.com/media/3o7TKSj06qV99N7fP2/giphy.gif",
                                        "https://media.giphy.com/media/3o7TKVUn7iM8FMEU24/giphy.gif",
                                        "https://media.giphy.com/media/3o7TKMGpx4B46vS46I/giphy.gif",
                                        "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif",
                                        "https://media.giphy.com/media/3o6Zt481isdL8EbF6M/giphy.gif"
                                    ].map((url, i) => (
                                        <div key={i} className="gif-picker-item-wrapper">
                                            <img 
                                                src={url} 
                                                alt="GIF" 
                                                className="search-gif-item" 
                                                onClick={() => { 
                                                    console.log('SocialAction: GIF selected', url);
                                                    onSendMessage(url, 'gif'); 
                                                    setShowGifs(false); 
                                                    setIsGifMode(false); 
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="action-sheet-grid">
                                {[
                                    { id: 'action-gif', label: 'GIFs', icon: <SmileIcon size={20} />, color: 'rgba(168, 85, 247, 0.2)', textColor: '#a855f7', action: () => { console.log('SocialAction: GIF clicked'); setIsGifMode(true); } },
                                    { id: 'action-gallery', label: 'Gallery', icon: <ImageIcon size={20} />, color: 'rgba(16, 185, 129, 0.2)', textColor: '#10b981', action: () => { console.log('SocialAction: Gallery clicked'); handleGalleryClick(); } },
                                    { id: 'action-camera', label: 'Camera', icon: <Camera size={20} />, color: 'rgba(59, 130, 246, 0.2)', textColor: '#3b82f6', action: () => { console.log('SocialAction: Camera clicked'); handleCameraClick(); } },
                                    { id: 'action-location', label: 'Location', icon: <Plus size={20} />, color: 'rgba(249, 115, 22, 0.2)', textColor: '#f97316', action: () => { console.log('SocialAction: Location clicked'); handleLocationClick(); } }
                                ].map((item) => (
                                    <div key={item.id} className="action-sheet-item" onClick={(e) => { 
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log(`SocialAction: Click captured for ${item.id}`);
                                        if (item.id !== 'action-gif') setShowGifs(false); 
                                        item.action(); 
                                    }}>
                                        <div className="action-sheet-icon-box" style={{ background: item.color, color: item.textColor }}>
                                            {item.icon}
                                        </div>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}

            <div className="chat-input-bar-glass">
                <div className="chat-input-wrapper-premium">
                    <div className="chat-input-prefix">
                        <button className="chat-camera-btn" onClick={handleCameraClick} aria-label="Camera">
                            <Camera size={20} color="#fff" strokeWidth={2.5} />
                        </button>
                    </div>
                    <input 
                        type="text" 
                        placeholder={isDisabled ? "Join community to chat" : "Message..."} 
                        className="chat-input-field" 
                        value={msgText}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                        disabled={isDisabled}
                    />
                    <div className="chat-input-suffix">
                        {msgText.trim() ? (
                            <button className="chat-send-btn" onClick={handleSendText}>Send</button>
                        ) : (
                            <div className="chat-input-actions-group">
                                <button className="chat-action-sm-btn" onClick={handleMicClick} aria-label="Microphone"><Mic size={20} /></button>
                                <button className="chat-action-sm-btn" onClick={handleGalleryClick} aria-label="Gallery"><ImageIcon size={20} /></button>
                                <button className="chat-action-sm-btn" onClick={handlePlusClick} aria-label="More options"><Plus size={20} /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
