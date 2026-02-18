import { useState, useRef, useEffect } from 'react';
import { Send, Phone, Video, Smile, Gift, Search, X, Globe, BadgeCheck, MoreVertical, Reply, Pin, Trash2, MapPin, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCall } from '../../context/CallContext';
import { getImageUrl } from '../../utils/imageUtils';
import '../../components/common/IconBtn.css';
import './Chat.css';
import GifPicker from '../common/GifPicker';
import config from '../../config';

const EMOJI_CATEGORIES = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', 'sweat', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', 'zipper_mouth_face', '🥴', 'cn', 'cb'],
    'People': ['👋', 'Qw', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', 'sw', '💃', '🕺', '👫', 'Cw', '👬', 'c'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', 'jw', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', 'mw', '🐣', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', 'Mosquito', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', 'Vm', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'],
    'Food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '玉米', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕️', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽', '🥣', '🥡', '🥢', '🧂'],
    'Activities': ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳️', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🤼‍♀️', '🤼', '🤸‍♀️', '🤸', '⛹️‍♀️', '⛹️', '🤺', '🤾‍♀️', '🤾', '🏌️‍♀️', '🏌️', '🏇', '🧘‍♀️', '🧘', '🏄‍♀️', '🏄', '🏊‍♀️', '🏊', '🤽‍♀️', '🤽', '🚣‍♀️', '🚣', '🧗‍♀️', '🧗', '🚵‍♀️', '🚵', '🚴‍♀️', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩']
};

const ChatWindow = ({
    activeChat,
    onSendMessage,
    onBack,
    showHeader = true,
    isAdmin = false,
    canManageMessages = false,
    isReadOnly = false,
    canPostInReadOnly = false,
    onReply,
    onPin,
    onDelete,
    onAvatarClick,
    showLocation = true
}) => {
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [activeEmojiCategory, setActiveEmojiCategory] = useState('Smileys');
    const [isLocating, setIsLocating] = useState(false);

    const [translatedMessages, setTranslatedMessages] = useState({});
    const chatContainerRef = useRef(null);
    const { showToast } = useToast();
    const { startCall } = useCall(); // Use global call context

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeChat?.messages]);

    // Reset input when switching chats
    useEffect(() => {
        setInputText('');
        setShowEmojiPicker(false);
        setShowGifPicker(false);
    }, [activeChat?.id, activeChat?.username]); // activeChat ID might vary between DM/Server, username is a safe fallback identifier

    if (!activeChat) {
        // ... (Empty state stays same)
        return (
            <div className="chat-window glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                    <Search size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>Select a conversation to start chatting</p>
                </div>
            </div>
        );
    }

    const handleSendMsg = () => {
        if (!inputText.trim()) return;
        onSendMessage(inputText);
        setInputText('');
    };

    const handleCall = (type) => {
        startCall(activeChat, type);
    };

    const handleEmojiClick = (emoji) => {
        setInputText(prev => prev + emoji);
    };

    const handleLocationShare = () => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser', 'error');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

                onSendMessage(null, 'location', {
                    lat: latitude,
                    lng: longitude,
                    url: locationUrl,
                    title: 'Shared Location'
                });
                setIsLocating(false);
            },
            (error) => {
                console.error(error);
                showToast('Unable to retrieve location. Check permissions.', 'error');
                setIsLocating(false);
            }
        );
    };

    const handleTranslate = (index, text) => {
        // ... (Translate logic stays same)
        if (translatedMessages[index]) {
            const newTranslations = { ...translatedMessages };
            delete newTranslations[index];
            setTranslatedMessages(newTranslations);
            return;
        }
        let translatedText = `[Translated]: ${text}`;
        // Mock simple translations
        const lower = text.toLowerCase().trim();
        if (lower === 'hola') translatedText = 'Hello';
        if (lower === 'bonjour') translatedText = 'Hello';

        setTranslatedMessages(prev => ({
            ...prev,
            [index]: translatedText
        }));
    };

    return (
        <div className="chat-window glass-panel" style={{ position: 'static', top: 'auto', marginTop: 0, transform: 'none', height: '100%' }}>
            {showHeader && (
                <div className="chat-header glass-card">
                    <div className="chat-user-info">
                        {onBack && (
                            <button className="icon-btn mobile-only" onClick={onBack} style={{ marginRight: '8px' }}>
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div className="chat-avatar-ring">
                            <div className="chat-avatar small" style={{ backgroundImage: `url(${getImageUrl(activeChat.avatar) || getImageUrl(activeChat.username, 'user')})` }} />
                            <div className="online-indicator" />
                        </div>
                        <div className="chat-user-meta">
                            <span className="chat-username" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {activeChat.username}
                                {activeChat.isOfficial && <BadgeCheck size={14} color="var(--color-primary)" fill="var(--color-primary-glow)" />}
                            </span>
                            <span className="user-status">Online</span>
                        </div>
                    </div>
                    <div className="chat-actions" style={{ zIndex: 100, position: 'relative', display: 'flex', gap: '8px' }}>
                        <button className="icon-btn" onClick={() => handleCall('audio')} title="Start Audio Call"><Phone size={20} /></button>
                        <button className="icon-btn" onClick={() => handleCall('video')} title="Start Video Call"><Video size={20} /></button>
                    </div>
                </div>
            )}

            <div className="chat-messages premium-scrollbar" ref={chatContainerRef}>
                {activeChat.messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.isMe ? 'me' : 'them'} animate-in`}>
                        <div className="message-sender-info">
                            <div
                                className="message-sender-avatar"
                                style={{
                                    backgroundImage: `url(${msg.senderAvatar ? getImageUrl(msg.senderAvatar) : getImageUrl(msg.senderName, 'user')})`,
                                    cursor: 'pointer'
                                }}
                                onClick={() => onAvatarClick && onAvatarClick(msg)}
                            />
                        </div>
                        <div className="message-content-wrapper">
                            <div className="message-sender-name" onClick={() => onAvatarClick && onAvatarClick(msg)} style={{ cursor: 'pointer' }}>
                                {msg.senderName}
                                <span className="message-time">{msg.time || 'Just now'}</span>
                            </div>
                            <div className={`message-bubble ${msg.sharedContent ? 'shared-bubble' : msg.gif ? 'gif-bubble' : ''}`}>
                                {msg.sharedContent ? (
                                    <div className="shared-content-card" onClick={() => {
                                        if (msg.sharedContent.type === 'location') window.open(msg.sharedContent.url, '_blank');
                                    }}>
                                        {msg.sharedContent.type === 'location' ? (
                                            <div className="location-preview">
                                                <div className="map-placeholder">
                                                    <MapPin size={32} color="#ff4b4b" />
                                                </div>
                                                <div className="location-info">
                                                    <span className="shared-type">LOCATION</span>
                                                    <span className="shared-title">Current Location</span>
                                                    <span className="coords">{msg.sharedContent.lat?.toFixed(4)}, {msg.sharedContent.lng?.toFixed(4)}</span>
                                                </div>
                                                <div className="view-shared-label">Open Maps</div>
                                            </div>
                                        ) : (
                                            <>
                                                <img src={msg.sharedContent.thumbnail} alt="" className="shared-thumb" />
                                                <div className="shared-info">
                                                    <span className="shared-type">{msg.sharedContent.type.toUpperCase()}</span>
                                                    <span className="shared-title">{msg.sharedContent.title}</span>
                                                </div>
                                                <div className="view-shared-label">View {msg.sharedContent.type}</div>
                                            </>
                                        )}
                                    </div>
                                ) : msg.gif ? (
                                    <img src={msg.gif} alt="GIF" className="chat-gif" />
                                ) : (
                                    <>
                                        {msg.text}
                                        {translatedMessages[index] && (
                                            <div className="translated-text animate-in">
                                                {translatedMessages[index]}
                                            </div>
                                        )}
                                        {msg.isPinned && (
                                            <div className="pinned-badge">
                                                <Pin size={10} /> Pinned
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className="message-actions-overlay">
                                    <button className="action-btn" onClick={() => onReply(msg)} title="Reply"><Reply size={14} /></button>
                                    {canManageMessages && (
                                        <>
                                            <button className="action-btn" onClick={() => onPin(msg)} title={msg.isPinned ? "Unpin" : "Pin"}>
                                                <Pin size={14} className={msg.isPinned ? "active-pin" : ""} />
                                            </button>
                                            <button className="action-btn delete" onClick={() => onDelete(msg)} title="Delete"><Trash2 size={14} /></button>
                                        </>
                                    )}
                                    {!msg.isMe && !msg.gif && !msg.sharedContent && (
                                        <button
                                            className={`action-btn ${translatedMessages[index] ? 'active' : ''}`}
                                            onClick={() => handleTranslate(index, msg.text)}
                                            title="Translate"
                                        >
                                            <Globe size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="chat-controls">
                {showEmojiPicker && (
                    <div className="emoji-picker-panel glass-card animate-slide-up">
                        <div className="emoji-category-tabs">
                            {/* Tabs logic */}
                            {Object.keys(EMOJI_CATEGORIES).map(cat => (
                                <button
                                    key={cat}
                                    className={`cat-tab ${activeEmojiCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveEmojiCategory(cat)}
                                >
                                    {EMOJI_CATEGORIES[cat][0]}
                                </button>
                            ))}
                        </div>
                        <div className="emoji-grid premium-scrollbar">
                            {EMOJI_CATEGORIES[activeEmojiCategory].map(emoji => (
                                <button key={emoji} onClick={() => handleEmojiClick(emoji)} className="emoji-item">
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {showGifPicker && (
                    <GifPicker
                        onSelect={(url) => {
                            onSendMessage(url, 'gif');
                            setShowGifPicker(false);
                        }}
                        onClose={() => setShowGifPicker(false)}
                    />
                )}

                <div className="chat-input-area glass-card" style={{ opacity: isReadOnly && !canPostInReadOnly ? 0.7 : 1 }}>
                    {isReadOnly && !canPostInReadOnly ? (
                        <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '10px' }}>
                            # This channel is read-only.
                        </div>
                    ) : (
                        <>
                            <div className="input-actions-left">
                                <button
                                    className={`input-tool-btn ${showEmojiPicker ? 'active' : ''}`}
                                    onClick={() => {
                                        setShowEmojiPicker(!showEmojiPicker);
                                        setShowGifPicker(false);
                                    }}
                                >
                                    <Smile size={22} />
                                </button>
                                <button
                                    className={`input-tool-btn ${showGifPicker ? 'active' : ''}`}
                                    onClick={() => {
                                        setShowGifPicker(!showGifPicker);
                                        setShowEmojiPicker(false);
                                    }}
                                >
                                    <Gift size={22} />
                                </button>
                                {showLocation && (
                                    <button
                                        className={`input-tool-btn ${isLocating ? 'pulse' : ''}`}
                                        onClick={handleLocationShare}
                                        title="Share Location"
                                        disabled={isLocating}
                                    >
                                        <MapPin size={22} color={isLocating ? 'var(--color-primary)' : 'currentColor'} />
                                    </button>
                                )}
                            </div>

                            <input
                                type="text"
                                placeholder={`Message ${activeChat.username || '...'}`}
                                className="chat-input-premium"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMsg()}
                            />

                            <button className={`send-btn-vibe ${inputText.trim() ? 'can-send' : ''}`} onClick={handleSendMsg}>
                                <Send size={20} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
