import { useState, useRef, useEffect } from 'react';
import { Send, Phone, Video, Smile, Gift, Search, X, Globe, BadgeCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCall } from '../../context/CallContext';
import { getImageUrl } from '../../utils/imageUtils';
import '../../components/common/IconBtn.css';
import './Chat.css';
import config from '../../config';

const EMOJI_CATEGORIES = {
    // ... existing categories (truncated for brevity in tool call, but will be preserved in file)
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'],
    'Love': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '💢', '💥', '💤', '💦', '💨', '💫', '💬', '💭', '🗯️'],
    'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙊', '🐒', '🦍', '🦧', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦝', '🐈', '🐈‍⬛', '🦓', '🦌', '🐂', '🐃', '🐄', '🐖', '🐗', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐁', '🐀', '🐿️', '🦔', '🦇', '🦥', '🦦', '🦨', '🦘', '🦡'],
    'Food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌯', '🥗', '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🧂', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🧊'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '⛸️', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄', '🎴', '🎭', '🖼️', '🎨', '🧵', '🧶'],
    'Vibes': ['🔥', '✨', '🌈', '☀️', '🌙', '⭐', '🌟', '💥', '💯', '⚡️', '🌠', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌚', '🌛', '🌜', '🌡️', '🌝', '🌞', '🪐', '🌌', '🌀', '🌈', '🌂', '☂️', '☔', '⛱️', '❄️', '☃️', '⛄', '☄️', '💧', '🌊'],
    'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛀', '🧼', '🪒', '🧴', '🧷'],
    'Symbols': ['🏧', '🚮', '🚰', '♿', '🚹', '🚺', '🚻', '🚼', '🚾', '⚠️', '🚸', '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '♨️', '☣️', '☢️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '🛐', '⚛️', '🕉️', '✡️', '☸️', '☯️', '✝️', '☦️', '☪️', '☮️', '🕎', '🔯', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎', '🔀', '🔁', '🔂', '▶️', '⏩', '◀️', '⏪', '🔼', '⏫', '🔽', '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '🔅', '🔆', '📶', '📳', '📴', '♾️', '♀️', '♂️', '⚧️']
};

import { ArrowLeft } from 'lucide-react';

const ChatWindow = ({ activeChat, onSendMessage, onBack, showHeader = true }) => {
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [activeEmojiCategory, setActiveEmojiCategory] = useState('Smileys');

    const [translatedMessages, setTranslatedMessages] = useState({});
    const messagesEndRef = useRef(null);
    const { showToast } = useToast();
    const { startCall } = useCall(); // Use global call context

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeChat?.messages]);

    if (!activeChat) {
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

    const handleTranslate = (index, text) => {
        if (translatedMessages[index]) {
            // Toggle off
            const newTranslations = { ...translatedMessages };
            delete newTranslations[index];
            setTranslatedMessages(newTranslations);
            return;
        }

        // Mock Translation Logic
        let translatedText = '';
        const lowerText = text.toLowerCase().trim();

        switch (lowerText) {
            case 'hola':
                translatedText = 'Hello';
                break;
            case 'bonjour':
                translatedText = 'Hello';
                break;
            case 'como estas':
            case 'cómo estás':
                translatedText = 'How are you?';
                break;
            case 'merci':
                translatedText = 'Thank you';
                break;
            case 'gracias':
                translatedText = 'Thank you';
                break;
            default:
                translatedText = `[Type-Safe Translated]: ${text}`;
        }

        setTranslatedMessages(prev => ({
            ...prev,
            [index]: translatedText
        }));
    };

    return (
        <div className="chat-window glass-panel">
            {showHeader && (
                <div className="chat-header glass-card">
                    <div className="chat-user-info">
                        {onBack && (
                            <button className="icon-btn mobile-only" onClick={onBack} style={{ marginRight: '8px' }}>
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div className="chat-avatar-ring">
                            <div className="chat-avatar small" style={{ backgroundImage: `url(${getImageUrl(activeChat.avatar) || `https://i.pravatar.cc/100?u=${activeChat.username}`})` }} />
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

            {/* CallOverlay is now handled globally in App.jsx */}

            <div className="chat-messages premium-scrollbar">
                {activeChat.messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.isMe ? 'me' : 'them'} animate-in`}>
                        {!msg.isMe && (
                            <div className="message-sender-info">
                                <div
                                    className="message-sender-avatar"
                                    style={{ backgroundImage: `url(${getImageUrl(msg.senderAvatar) || `https://i.pravatar.cc/100?u=${msg.senderName}`})` }}
                                />
                                <span className="message-sender-name">{msg.senderName}</span>
                            </div>
                        )}
                        <div className={`message-bubble ${msg.sharedContent ? 'shared-bubble' : msg.gif ? 'gif-bubble' : ''}`}>
                            {msg.sharedContent ? (
                                <div className="shared-content-card">
                                    <img src={msg.sharedContent.thumbnail} alt="" className="shared-thumb" />
                                    <div className="shared-info">
                                        <span className="shared-type">{msg.sharedContent.type.toUpperCase()}</span>
                                        <span className="shared-title">{msg.sharedContent.title}</span>
                                    </div>
                                    <div className="view-shared-label">View {msg.sharedContent.type}</div>
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
                                </>
                            )}
                            {!msg.isMe && !msg.gif && !msg.sharedContent && (
                                <button
                                    className={`translate-btn ${translatedMessages[index] ? 'active' : ''}`}
                                    onClick={() => handleTranslate(index, msg.text)}
                                    title="Translate message"
                                >
                                    <Globe size={12} />
                                </button>
                            )}
                        </div>
                        <span className="message-time">{msg.time}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-controls">
                {showEmojiPicker && (
                    <div className="emoji-picker-panel glass-card animate-slide-up">
                        <div className="emoji-category-tabs">
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



                <div className="chat-input-area glass-card">
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

                    </div>

                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="chat-input-premium"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMsg()}
                    />

                    <button className={`send-btn-vibe ${inputText.trim() ? 'can-send' : ''}`} onClick={handleSendMsg}>
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
