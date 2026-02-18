import { useState, useRef, useEffect } from 'react';
import { VolumeX, MoreHorizontal, Trash2, EyeOff, Eraser, Volume2, ArrowLeft } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import './Chat.css';

// Long press hook removed in favor of explicit menu button

const ChatItem = ({ chat, activeChatId, onSelectChat, onShowMenu, menuConvo }) => {
    return (
        <div
            className={`chat-item ${activeChatId === chat.id ? 'active' : ''} ${chat.isMuted ? 'muted' : ''}`}
            onClick={() => onSelectChat(chat)}
        >
            <div className="chat-avatar" style={{ backgroundImage: `url(${getImageUrl(chat.avatar)})` }} />
            <div className="chat-item-info">
                <div className="chat-item-name-row">
                    <span className="chat-item-name">{chat.username}</span>
                    {chat.isMuted && <VolumeX size={12} className="muted-icon" />}
                </div>
                <span className="chat-item-preview">{chat.lastMessage}</span>
            </div>
            <div className="chat-item-right">
                <span className="chat-item-time">{chat.time}</span>
                <button
                    className="convo-menu-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowMenu(chat, e);
                    }}
                >
                    <MoreHorizontal size={18} />
                </button>
            </div>
        </div>
    );
};

const ChatList = ({ chats, activeChatId, onSelectChat, onConvoAction, onBack }) => {
    const [menuConvo, setMenuConvo] = useState(null);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

    const listRef = useRef(null);

    const handleShowMenu = (chat, e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const containerRect = listRef.current.getBoundingClientRect();

        // Calculate position relative to container
        setMenuPos({
            x: rect.left - containerRect.left - 120, // Offset left
            y: rect.top - containerRect.top + rect.height // Below the button
        });
        setMenuConvo(chat);
    };

    useEffect(() => {
        const handleClick = () => setMenuConvo(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="chat-list-container">
            <div className="chat-list-header-row">
                {onBack && (
                    <button className="back-btn-simple mobile-only" onClick={onBack}>
                        <ArrowLeft size={24} />
                    </button>
                )}
                <h3 className="chat-list-header">Messages</h3>
            </div>
            <div className="chat-list" ref={listRef}>
                {chats.length > 0 ? (
                    chats.map(chat => (
                        <ChatItem
                            key={chat.id}
                            chat={chat}
                            activeChatId={activeChatId}
                            onSelectChat={onSelectChat}
                            onShowMenu={handleShowMenu}
                            menuConvo={menuConvo}
                        />
                    ))
                ) : (
                    <div className="empty-chats-container animate-in">
                        <div className="empty-chats-vibe">
                            <div className="empty-icon-wrapper pulse">
                                <Eraser size={40} strokeWidth={1.5} />
                            </div>
                            <h4>No messages yet</h4>
                            <p>Your conversations will appear here. Start a chat from a profile!</p>
                        </div>
                    </div>
                )}
            </div>

            {menuConvo && (
                <div
                    className="convo-context-menu glass-card animate-in"
                    style={{ top: menuPos.y, left: menuPos.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => onConvoAction(menuConvo.conversationId, 'mute')}>
                        {menuConvo.isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        {menuConvo.isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <button onClick={() => onConvoAction(menuConvo.conversationId, 'hide')}>
                        <EyeOff size={16} /> Hide
                    </button>
                    <button onClick={() => onConvoAction(menuConvo.conversationId, 'clear')}>
                        <Eraser size={16} /> Clear
                    </button>
                    <button onClick={() => onConvoAction(menuConvo.conversationId, 'delete')} className="delete-action">
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChatList;
