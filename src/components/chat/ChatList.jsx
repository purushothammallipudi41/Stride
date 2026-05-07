import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Edit, Camera, UserPlus, Check } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useActivity } from '../../hooks/useActivity';
import { useUI } from '../../hooks/useUI';
import VerificationBadge from '../common/VerificationBadge';
import './Chat.css';

const ChatList = ({ chats, activeChatId, onSelectChat, typingUsers, currentUser }) => {
    const { isUserListening } = useActivity();
    const { unreadNotifications, openExplorer } = useUI();
    const [showAccounts, setShowAccounts] = useState(false);
    const [activeTab, setActiveTab] = useState('messages');
    const navigate = useNavigate();

    const filteredChats = chats.filter(chat => {
        if (activeTab === 'requests') return chat.isRequest;
        return !chat.isRequest;
    });
    
    return (
        <div className="chat-list-container glass-panel">
            <div className="chat-list-header-v2">
                <div className="chat-header-top">
                    <div className="chat-header-user" onClick={() => setShowAccounts(!showAccounts)}>
                        <span style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{currentUser || 'purushotham_m'}</span>
                        <ChevronDown size={18} className="ml-1" />
                        {unreadNotifications > 0 && (
                            <div className="notification-dot-v2" />
                        )}
                    </div>
                    <button className="chat-compose-btn" onClick={() => openExplorer()} aria-label="Compose Message">
                        <Edit size={20} />
                    </button>

                    {showAccounts && (
                        <div className="account-switcher-dropdown glass-panel animate-fade-in">
                            <div className="account-item active">
                                <Avatar size={32} src={null} alt={currentUser} />
                                <div className="account-info">
                                    <span className="account-name">{currentUser}</span>
                                    <span className="account-sub">Current account</span>
                                </div>
                                <Check size={18} color="var(--theme-primary)" />
                            </div>
                            <div className="account-divider" />
                            <div className="account-item secondary" onClick={() => setShowAccounts(false)}>
                                <div className="add-account-icon">
                                    <UserPlus size={20} />
                                </div>
                                <span>Switch or Add Account</span>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="chat-list-tabs" onClick={() => setShowAccounts(false)}>
                    <button 
                        className={`chat-tab ${activeTab === 'messages' ? 'active' : ''}`}
                        onClick={() => setActiveTab('messages')}
                    >
                        Messages
                    </button>
                    <button 
                        className={`chat-tab ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Requests
                    </button>
                </div>
            </div>

            <div className="chat-list" onClick={() => setShowAccounts(false)}>
                {filteredChats.length > 0 ? (
                    filteredChats.map(chat => {
                        const isTyping = typingUsers.has(chat.username);
                        const isListening = isUserListening(chat.username);
                        
                        return (
                            <div
                                key={chat.id}
                                className={`chat-item-v2 ${activeChatId === chat.id ? 'active' : ''}`}
                                onClick={() => onSelectChat(chat)}
                            >
                                <Avatar 
                                    src={chat.avatar} 
                                    alt={chat.username} 
                                    size={56} 
                                    frame={chat.avatarFrame || 'none'}
                                    isListening={isListening}
                                />
                                <div className="chat-item-info">
                                    <div className="chat-item-name-row">
                                        <span className="chat-item-name">{chat.name || chat.username}</span>
                                        {chat.isVerified && <VerificationBadge size={14} />}
                                    </div>
                                    <span className="chat-item-status">
                                        {isTyping ? <span className="text-gradient-bg" style={{ fontWeight: 700 }}>typing...</span> : (chat.lastMessageStatus || chat.lastMessage || `Sent ${chat.time || '10h ago'}`)}
                                    </span>
                                </div>
                                <Camera size={22} className="chat-item-action" />
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-chat-list-placeholder animate-fade-in">
                        <div className="empty-chat-icon-pulse">
                            <Edit size={40} className="text-white opacity-20" />
                        </div>
                        <h3>No Waves Found</h3>
                        <p>Your inbox is a quiet ocean. Start a conversation to make some waves.</p>
                        <button className="start-chat-btn" onClick={() => navigate('/explore')}>
                            Start a Conversation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatList;
