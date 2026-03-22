import { ChevronDown, Edit, Camera } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useActivity } from '../../hooks/useActivity';
import './Chat.css';

const ChatList = ({ chats, activeChatId, onSelectChat, typingUsers, currentUser }) => {
    const { isUserListening } = useActivity();
    
    return (
        <div className="chat-list-container">
            <div className="chat-list-header-v2">
                <div className="chat-header-top">
                    <div className="chat-header-user">
                        <span>{currentUser || 'purushotham_mallipudi'}</span>
                        <ChevronDown size={18} />
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff3b30' }} />
                    </div>
                    <Edit size={24} className="chat-action-icon" />
                </div>
                
                <div className="chat-list-tabs">
                    <button className="chat-tab active">Messages</button>
                    <button className="chat-tab">Requests</button>
                </div>
            </div>

            <div className="chat-list">
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
                            />
                            <div className="chat-item-info">
                                <span className="chat-item-name">{chat.username}</span>
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
