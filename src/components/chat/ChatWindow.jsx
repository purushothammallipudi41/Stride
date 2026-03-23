import { useState, useEffect, useRef } from 'react';
import { Phone, Video, Image, ChevronLeft, Mic, Plus, Smile, Camera } from 'lucide-react';
import socket from '../../services/socket';
import Avatar from '../common/Avatar';
import VerificationBadge from '../common/VerificationBadge';
import './Chat.css';

const ChatWindow = ({ activeChat, onSendMessage, roomId, currentUser, onBack }) => {
    const [msgText, setMsgText] = useState('');
    const [showGifs, setShowGifs] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeChat?.messages]);

    useEffect(() => {
        if (!roomId || !currentUser) return;

        if (activeChat?.messages?.length > 0) {
            const lastMsg = activeChat.messages[activeChat.messages.length - 1];
            socket.emit('message_seen', { roomId, messageId: lastMsg.id, username: currentUser });
        }
    }, [roomId, currentUser, activeChat?.messages]);

    const handleInputChange = (e) => {
        setMsgText(e.target.value);
    };

    const handleSendText = () => {
        if (msgText.trim()) {
            onSendMessage(msgText, 'text');
            setMsgText('');
        }
    };

    if (!activeChat) {
        return (
            <div className="chat-window-v2 empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                <p>Select a conversation to start chatting</p>
            </div>
        );
    }

    return (
        <div className="chat-window-v2 animate-fade-in">
            <div className="chat-header-v2">
                <div className="chat-header-left">
                    <button className="chat-action-icon" onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', padding: 0 }}>
                        <ChevronLeft size={28} />
                    </button>
                    <Avatar 
                        src={activeChat.avatar} 
                        alt="Avatar" 
                        size={32} 
                        frame={activeChat.avatarFrame || 'none'}
                    />
                    <div className="chat-header-info">
                        <div className="chat-header-name-row" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="chat-header-name" style={{ margin: 0 }}>{activeChat.name || activeChat.username}</span>
                            {activeChat.isVerified && <VerificationBadge size={16} />}
                        </div>
                        <span className="chat-header-sub">{activeChat.username}</span>
                    </div>
                </div>
                <div className="chat-header-right">
                    <Phone size={24} className="chat-action-icon" />
                    <Video size={24} className="chat-action-icon" />
                </div>
            </div>

            <div className="chat-messages-v2">
                {activeChat.messages.map((msg, index) => {
                    const isLastInGroup = index === activeChat.messages.length - 1 || activeChat.messages[index + 1].username !== msg.username;
                    return (
                        <div key={msg.id || index} className={`message-v2 ${msg.isMe ? 'me' : 'them'}`}>
                            {!msg.isMe && isLastInGroup && (
                                <div className="message-group-avatar">
                                    <Avatar src={activeChat.avatar} size={28} />
                                </div>
                            )}
                            <div className="message-content">
                                <div className="message-bubble-v2">
                                    {msg.text}
                                </div>
                                {msg.isMe && isLastInGroup && (
                                    <div className="message-status-v2">
                                        {msg.readStatus ? 'Seen' : 'Sent'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container-v2">
                <div className="chat-input-wrapper-v2">
                    <div className="chat-input-actions" style={{ marginRight: 8 }}>
                        <div style={{ backgroundColor: '#3797f0', borderRadius: '50%', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Camera size={20} color="#fff" />
                        </div>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Message..." 
                        className="chat-input-v2" 
                        value={msgText}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    />
                    <div className="chat-input-actions">
                        {msgText.trim() ? (
                            <button 
                                onClick={handleSendText} 
                                style={{ background: 'none', border: 'none', color: '#3797f0', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}
                            >
                                Send
                            </button>
                        ) : (
                            <>
                                <Mic size={24} className="chat-action-icon" />
                                <Image size={24} className="chat-action-icon" />
                                <Smile size={24} className="chat-action-icon" onClick={() => setShowGifs(!showGifs)} />
                                <Plus size={24} className="chat-action-icon" />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
