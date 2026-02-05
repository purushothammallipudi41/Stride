import { Send, Phone, Video } from 'lucide-react';
import './Chat.css';

const ChatWindow = ({ activeChat }) => {
    if (!activeChat) {
        return (
            <div className="chat-window empty">
                <p>Select a conversation to start chatting</p>
            </div>
        );
    }

    return (
        <div className="chat-window">
            <div className="chat-header">
                <div className="chat-user-info">
                    <div className="chat-avatar small" />
                    <span className="chat-username">{activeChat.username}</span>
                </div>
                <div className="chat-actions">
                    <button><Phone size={20} /></button>
                    <button><Video size={20} /></button>
                </div>
            </div>

            <div className="chat-messages">
                {activeChat.messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.isMe ? 'me' : 'them'}`}>
                        <div className="message-bubble">
                            {msg.text}
                        </div>
                        <span className="message-time">{msg.time}</span>
                    </div>
                ))}
            </div>

            <div className="chat-input-area">
                <input type="text" placeholder="Type a message..." className="chat-input" />
                <button className="send-btn">
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;
