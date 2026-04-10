import { useState, useEffect, useRef } from 'react';
import { Phone, Video, Image as ImageIcon, ChevronLeft, Mic, Plus, Smile as SmileIcon, Camera, MessageSquare } from 'lucide-react';
import socket from '../../services/socket';
import Avatar from '../common/Avatar';
import VerificationBadge from '../common/VerificationBadge';
import './Chat.css';

const ChatWindow = ({ activeChat, onSendMessage, onStartCall, roomId, currentUser, onBack, isDisabled, hideCallButtons, typingUsers }) => {
    const [msgText, setMsgText] = useState('');
    const [showGifs, setShowGifs] = useState(false);
    const messagesEndRef = useRef(null);

    const fileInputRef = useRef(null);

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
        // Mock camera trigger or show feedback
        console.log("Camera triggered");
        alert("Camera feature coming soon in Stride Pro!");
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
                                        {msg.text}
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

            {showGifs && (
                <div 
                    className="chat-actions-drawer animate-slide-up" 
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 70px)',
                        left: '16px',
                        right: '16px',
                        background: 'rgba(255, 0, 0, 0.95)', // RED SMOKE TEST INLINE
                        backdropFilter: 'blur(24px)',
                        borderRadius: '24px',
                        padding: '24px 16px',
                        zIndex: 2000,
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        border: '3px solid white'
                    }}
                >
                    <div style={{ display: 'none' }}>DESTRUCTION_V2.2</div>
                    <div className="drawer-handle" onClick={() => setShowGifs(false)}></div>
                    <div 
                        className="drawer-grid"
                        style={{
                            display: 'flex',
                            justifyContent: 'space-evenly',
                            width: '100%',
                            gap: '8px'
                        }}
                    >
                        <div className="drawer-item" onClick={() => alert("Giphy integration loading...")} style={{ width: '64px', flexShrink: 0, textAlign: 'center' }}>
                            <div className="drawer-icon-box" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', width: '50px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <SmileIcon size={24} />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#fff' }}>GIFs</span>
                        </div>
                        <div className="drawer-item" onClick={handleGalleryClick} style={{ width: '64px', flexShrink: 0, textAlign: 'center' }}>
                            <div className="drawer-icon-box" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', width: '50px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <ImageIcon size={24} />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#fff' }}>Gallery</span>
                        </div>
                        <div className="drawer-item" onClick={handleCameraClick} style={{ width: '64px', flexShrink: 0, textAlign: 'center' }}>
                            <div className="drawer-icon-box" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', width: '50px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <Camera size={24} />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#fff' }}>Camera</span>
                        </div>
                        <div className="drawer-item" onClick={() => alert("Location sharing active")} style={{ width: '64px', flexShrink: 0, textAlign: 'center' }}>
                            <div className="drawer-icon-box" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#f97316', width: '50px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <Plus size={24} />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#fff' }}>Location</span>
                        </div>
                    </div>
                </div>
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
