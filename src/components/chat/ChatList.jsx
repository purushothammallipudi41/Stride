import { useState } from 'react';
import { ChevronDown, Edit, Camera, UserPlus, Check } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useActivity } from '../../hooks/useActivity';
import { useUI } from '../../hooks/useUI';
import VerificationBadge from '../common/VerificationBadge';
import './Chat.css';

const ChatList = ({ chats, activeChatId, onSelectChat, typingUsers, currentUser }) => {
    const { isUserListening } = useActivity();
    const { unreadNotifications } = useUI();
    const [showAccounts, setShowAccounts] = useState(false);
    
    return (
        <div className="chat-list-container">
            <div className="chat-list-header-v2">
                <div className="chat-header-top">
                    <div className="chat-header-user" onClick={() => setShowAccounts(!showAccounts)}>
                        <span>{currentUser || 'purushotham_mallipudi'}</span>
                        <ChevronDown size={18} />
                        {unreadNotifications > 0 && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff3b30' }} />
                        )}
                    </div>
                    <Edit size={24} className="chat-action-icon" />

                    {showAccounts && (
                        <div className="account-switcher-dropdown animate-fade-in">
                            <div className="account-item active">
                                <Avatar size={32} src={null} alt={currentUser} />
                                <div className="account-info">
                                    <span className="account-name">{currentUser}</span>
                                    <span className="account-sub">Current account</span>
                                </div>
                                <Check size={18} color="#3797f0" />
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
                    <button className="chat-tab active">Messages</button>
                    <button className="chat-tab">Requests</button>
                </div>
            </div>

            <div className="chat-list" onClick={() => setShowAccounts(false)}>
                {chats.map(chat => {
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
                                isVerified={chat.isVerified}
                            />
                            <div className="chat-item-info">
                                <div className="chat-item-name-row" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span className="chat-item-name">{chat.username}</span>
                                    {chat.isVerified && <VerificationBadge size={14} />}
                                </div>
                                <span className="chat-item-status">
                                    {isTyping ? 'typing...' : chat.lastMessageStatus || `Sent ${chat.time || '10h ago'}`}
                                </span>
                            </div>
                            <Camera size={24} className="chat-item-action" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatList;
