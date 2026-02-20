import { useState, useRef, useEffect } from 'react';
import { Send, Phone, Video, Smile, Gift, Search, X, Globe, BadgeCheck, MoreVertical, Reply, Pin, Trash2, MapPin, ArrowLeft, Image } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCall } from '../../context/CallContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageUtils';
import '../../components/common/IconBtn.css';
import './Chat.css';
import GifPicker from '../common/GifPicker';
import config from '../../config';
import { uploadToCloudinary } from '../../utils/cloudinaryUtils';

const EMOJI_CATEGORIES = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🥴'],
    'People': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💃', '🕺', '👫', '👭', '👬'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '蛛', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦏', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🦚', '🦜', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'],
    'Food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', 'バター', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕️', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽', '🥣', '🥡', '🥢', '🧂'],
    'Activities': ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', 'ドレッサー', '🏒', '🏑', '🥍', ' cricket', '🥅', '⛳️', '🪁', '🏹', '宿題', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🤼‍♀️', '🤼', '🤸‍♀️', '🤸', '⛹️‍♀️', '⛹️', '🤺', '🤾‍♀️', '🤾', '🏌️‍♀️', '平衡', '🏇', '🧘‍♀️', '🧘', '🏄', '🏊', '🤽‍♀️', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', 'ギター', '🪕', 'バイオリン', '🎲', '♟', '🎯', 'ボーリング', '🎮', '🎰', '🧩']
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
    const [replyingTo, setReplyingTo] = useState(null);

    const [translatedMessages, setTranslatedMessages] = useState({});
    const [typingUser, setTypingUser] = useState(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const fileInputRef = useRef(null);
    const chatContainerRef = useRef(null);
    const { showToast } = useToast();
    const { startCall } = useCall();
    const { socket, isUserOnline } = useSocket();
    const { user } = useAuth();

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeChat?.messages]);

    useEffect(() => {
        setInputText('');
        setShowEmojiPicker(false);
        setShowGifPicker(false);
        setTypingUser(null);
        setReplyingTo(null);
    }, [activeChat?.id, activeChat?.username]);

    // Typing and Read Receipt Listeners
    useEffect(() => {
        if (!socket || !activeChat) return;

        socket.on('user-typing', ({ from, fromName, typing }) => {
            if (fromName === activeChat.username || from === activeChat.id) {
                setTypingUser(typing ? fromName : null);
            }
        });

        return () => {
            socket.off('user-typing');
        };
    }, [socket, activeChat]);

    // Read Receipt Logic
    useEffect(() => {
        if (!socket || !activeChat || !activeChat.messages) return;

        const lastThemMessage = [...activeChat.messages].reverse().find(m => !m.isMe);
        if (lastThemMessage && lastThemMessage.status !== 'read') {
            socket.emit('message-read', {
                messageId: lastThemMessage._id || lastThemMessage.id,
                fromId: user.id
            });
        }
    }, [activeChat?.messages?.length, socket]);

    if (!activeChat) {
        return (
            <div className="chat-window-v2-root flex-center" style={{ height: '100%', color: 'rgba(255,255,255,0.7)' }}>
                <div style={{ textAlign: 'center' }}>
                    <Search size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>Select a conversation to start chatting</p>
                </div>
            </div>
        );
    }

    const handleSendMsg = () => {
        if (!inputText.trim()) return;
        onSendMessage(inputText, 'text', replyingTo ? { replyTo: replyingTo._id || replyingTo.id } : null);
        setInputText('');
        setReplyingTo(null);
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
                onSendMessage(null, 'location', { lat: latitude, lng: longitude, url: locationUrl, title: 'Shared Location' });
                setIsLocating(false);
            },
            (error) => {
                showToast('Unable to retrieve location.', 'error');
                setIsLocating(false);
            }
        );
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingMedia(true);
        try {
            const uploadedUrl = await uploadToCloudinary(file);
            if (uploadedUrl) {
                const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
                onSendMessage(mediaType === 'video' ? 'Sent a video' : 'Sent an image', 'text', null, { mediaUrl: uploadedUrl, mediaType });
            }
        } catch (error) {
            showToast('Failed to upload media', 'error');
        } finally {
            setUploadingMedia(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleTranslate = (index, text) => {
        if (translatedMessages[index]) {
            const newTranslations = { ...translatedMessages };
            delete newTranslations[index];
            setTranslatedMessages(newTranslations);
            return;
        }
        setTranslatedMessages(prev => ({ ...prev, [index]: `[Translated]: ${text}` }));
    };

    const groupMessagesByDate = (msgs) => {
        const groups = [];
        msgs.forEach(msg => {
            const date = msg.timestamp ? new Date(msg.timestamp) : new Date();
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);

            let label = date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            if (date.toDateString() === now.toDateString()) label = 'Today';
            else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';

            let group = groups.find(g => g.label === label);
            if (!group) {
                group = { label, messages: [] };
                groups.push(group);
            }
            group.messages.push(msg);
        });
        return groups;
    };

    const groupedMessages = groupMessagesByDate(activeChat.messages || []);

    const getStatusText = (status) => {
        if (status === 'read') return 'Done';
        if (status === 'delivered') return 'Delivered';
        return 'Sent';
    };

    return (
        <div className="chat-window glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'static', top: 'auto', margin: 0, transform: 'none' }}>
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
                            <div className={`online-indicator ${isUserOnline(activeChat.id) ? 'online' : ''}`} />
                        </div>
                        <div className="chat-user-meta">
                            <span className="chat-username" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {activeChat.username}
                                {activeChat.isOfficial && <BadgeCheck size={14} color="var(--color-primary)" fill="var(--color-primary-glow)" />}
                            </span>
                            <span className="chat-status">{typingUser ? 'typing...' : (isUserOnline(activeChat.id) ? 'Online' : 'Offline')}</span>
                        </div>
                    </div>
                    <div className="chat-actions">
                        <button className="icon-btn" onClick={() => handleCall('audio')} title="Start Audio Call"><Phone size={20} /></button>
                        <button className="icon-btn" onClick={() => handleCall('video')} title="Start Video Call"><Video size={20} /></button>
                    </div>
                </div>
            )}

            <div className="chat-messages premium-scrollbar" ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto' }}>
                {groupedMessages.map((group, gIndex) => (
                    <div key={gIndex} className="message-group">
                        <div className="date-separator"><span>{group.label}</span></div>
                        {group.messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.isMe ? 'me' : 'them'} animate-in`}>
                                <div className="message-sender-info">
                                    <div
                                        className="message-sender-avatar"
                                        style={{ backgroundImage: `url(${msg.senderAvatar ? getImageUrl(msg.senderAvatar) : getImageUrl(msg.senderName, 'user')})` }}
                                    />
                                </div>
                                <div className="message-content-wrapper">
                                    {!msg.isMe && <div className="message-sender-name">{msg.senderName}</div>}

                                    {msg.replyToMessage && (
                                        <div className="reply-preview-bubble">
                                            <div className="reply-bar" />
                                            <div className="reply-content">
                                                <span className="reply-user">{msg.replyToMessage.username || msg.replyToMessage.senderName}</span>
                                                <span className="reply-text">{msg.replyToMessage.text}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`message-bubble ${msg.sharedContent ? 'shared-bubble' : msg.gif ? 'gif-bubble' : ''} ${msg.isMe && user?.unlockedPerks?.includes('chat_bubbles') ? 'chat-bubbles-perk' : ''}`}>
                                        {msg.sharedContent ? (
                                            <div className="shared-content-card" onClick={() => msg.sharedContent.type === 'location' && window.open(msg.sharedContent.url, '_blank')}>
                                                {msg.sharedContent.type === 'location' ? (
                                                    <div className="location-preview">
                                                        <div className="map-placeholder"><MapPin size={32} color="#ff4b4b" /></div>
                                                        <div className="location-info">
                                                            <span className="shared-type">LOCATION</span>
                                                            <span className="shared-title">Current Location</span>
                                                            <span className="coords">{msg.sharedContent.lat?.toFixed(4)}, {msg.sharedContent.lng?.toFixed(4)}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <img src={msg.sharedContent.thumbnail} alt="" className="shared-thumb" />
                                                        <div className="shared-info">
                                                            <span className="shared-type">{msg.sharedContent.type.toUpperCase()}</span>
                                                            <span className="shared-title">{msg.sharedContent.title}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : msg.mediaUrl ? (
                                            msg.mediaType === 'video' ? (
                                                <video src={msg.mediaUrl} controls className="chat-media-attachment" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                                            ) : (
                                                <img src={msg.mediaUrl} alt="Attachment" className="chat-media-attachment" style={{ maxWidth: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                                            )
                                        ) : msg.gif ? (
                                            <img src={msg.gif} alt="GIF" className="chat-gif" />
                                        ) : (
                                            <>
                                                {msg.text}
                                                {translatedMessages[index] && <div className="translated-text animate-in">{translatedMessages[index]}</div>}
                                                {msg.isPinned && <div className="pinned-badge"><Pin size={10} /> Pinned</div>}
                                            </>
                                        )}
                                        <div className="message-meta-v2">
                                            <span className="msg-timestamp">{msg.time || new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {msg.isMe && <span className={`msg-status-v2 ${msg.status}`}>{getStatusText(msg.status)}</span>}
                                            <div className="message-actions-overlay">
                                                <button className="msg-action-icon" onClick={() => setReplyingTo(msg)} title="Reply"><Reply size={14} /></button>
                                                <button className="msg-action-icon" onClick={() => onPin && onPin(msg)} title="Pin"><Pin size={14} /></button>
                                                {(isAdmin || canManageMessages || msg.isMe) && (
                                                    <button className="msg-action-icon delete" onClick={() => onDelete && onDelete(msg)} title="Delete"><Trash2 size={14} /></button>
                                                )}
                                                {!msg.isMe && !msg.gif && !msg.sharedContent && (
                                                    <button className={`msg-action-icon ${translatedMessages[index] ? 'active' : ''}`} onClick={() => handleTranslate(index, msg.text)} title="Translate"><Globe size={14} /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="chat-controls">
                {replyingTo && (
                    <div className="reply-context-bar animate-slide-up">
                        <div className="reply-icon"><Reply size={14} /></div>
                        <div className="reply-text">Replying to <strong>{replyingTo.senderName || replyingTo.username}</strong>: {replyingTo.text}</div>
                        <button className="close-reply" onClick={() => setReplyingTo(null)}><X size={14} /></button>
                    </div>
                )}

                {showEmojiPicker && (
                    <div className="emoji-picker-panel glass-card animate-slide-up">
                        <div className="emoji-category-tabs">
                            {Object.keys(EMOJI_CATEGORIES).map(cat => (
                                <button key={cat} className={`cat-tab ${activeEmojiCategory === cat ? 'active' : ''}`} onClick={() => setActiveEmojiCategory(cat)}>{EMOJI_CATEGORIES[cat][0]}</button>
                            ))}
                        </div>
                        <div className="emoji-grid premium-scrollbar">
                            {EMOJI_CATEGORIES[activeEmojiCategory].map(emoji => (
                                <button key={emoji} onClick={() => handleEmojiClick(emoji)} className="emoji-item">{emoji}</button>
                            ))}
                        </div>
                    </div>
                )}

                {showGifPicker && <GifPicker onSelect={(url) => { onSendMessage(url, 'gif'); setShowGifPicker(false); }} onClose={() => setShowGifPicker(false)} />}

                <div className="chat-input-area glass-card" style={{ opacity: isReadOnly && !canPostInReadOnly ? 0.7 : 1 }}>
                    {isReadOnly && !canPostInReadOnly ? (
                        <div style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', padding: '10px' }}># This channel is read-only.</div>
                    ) : (
                        <>
                            <div className="input-actions-left">
                                <button className="input-tool-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia}>
                                    <Image size={22} color={uploadingMedia ? 'var(--color-primary)' : 'currentColor'} className={uploadingMedia ? 'pulse' : ''} />
                                </button>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleFileUpload} />
                                <button className={`input-tool-btn ${showEmojiPicker ? 'active' : ''}`} onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}><Smile size={22} /></button>
                                <button className={`input-tool-btn ${showGifPicker ? 'active' : ''}`} onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}><Gift size={22} /></button>
                                {showLocation && <button className={`input-tool-btn ${isLocating ? 'pulse' : ''}`} onClick={handleLocationShare} title="Share Location" disabled={isLocating}><MapPin size={22} color={isLocating ? 'var(--color-primary)' : 'currentColor'} /></button>}
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
