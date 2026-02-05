import './Chat.css';

const ChatList = ({ chats, activeChatId, onSelectChat }) => {
    return (
        <div className="chat-list-container">
            <h3 className="chat-list-header">Messages</h3>
            <div className="chat-list">
                {chats.map(chat => (
                    <div
                        key={chat.id}
                        className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                        onClick={() => onSelectChat(chat)}
                    >
                        <div className="chat-avatar" />
                        <div className="chat-item-info">
                            <span className="chat-item-name">{chat.username}</span>
                            <span className="chat-item-preview">{chat.lastMessage}</span>
                        </div>
                        <span className="chat-item-time">{chat.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatList;
