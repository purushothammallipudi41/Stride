import Avatar from '../common/Avatar';
import { useActivity } from '../../hooks/useActivity';
import './Chat.css';

const ChatList = ({ chats, activeChatId, onSelectChat, typingUsers }) => {
    const { isUserListening, getUserTrack } = useActivity();
    return (
        <div className="chat-list-container">
            <h3 className="chat-list-header">Messages</h3>
            <div className="chat-list">
                {chats.map(chat => {
                    const isTyping = typingUsers.has(chat.username);
                    const isListening = isUserListening(chat.username);
                    const currentTrack = getUserTrack(chat.username);
                    return (
                        <div
                            key={chat.id}
                            className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                            onClick={() => onSelectChat(chat)}
                        >
                            <Avatar 
                                src={chat.avatar} 
                                alt={chat.username} 
                                size={40} 
                                frame={chat.avatarFrame || 'none'}
                                isListening={isListening}
                            />
                            <div className="chat-item-info">
                                <span className="chat-item-name">{chat.username}</span>
                                {isTyping ? (
                                    <span className="chat-item-typing">typing...</span>
                                ) : isListening && currentTrack ? (
                                    <span className="chat-item-listening">Listening to {currentTrack.title}</span>
                                ) : (
                                    <span className="chat-item-preview">{chat.lastMessage}</span>
                                )}
                            </div>
                            <span className="chat-item-time">{chat.time}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export default ChatList;
