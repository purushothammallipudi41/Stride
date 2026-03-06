import { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, Smile, Image, Sticker, Wand2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useServer } from '../../context/ServerContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import UserAvatar from '../common/UserAvatar';
import config from '../../config';
import './Chat.css';

const ThreadSidebar = ({ serverId, channelId, threadId, onClose }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { fetchThreadMessages, sendServerMessage } = useServer();
    const { showToast } = useToast();

    const [parentMessage, setParentMessage] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const chatMessagesRef = useRef(null);

    useEffect(() => {
        const loadThread = async () => {
            setLoading(true);
            const data = await fetchThreadMessages(serverId, channelId, threadId);
            setParentMessage(data.parent);
            setReplies(data.replies);
            setLoading(false);
        };
        loadThread();
    }, [threadId, serverId, channelId]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            if (newMessage.threadParentId === threadId) {
                setReplies(prev => {
                    if (prev.find(m => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });
            }
        };

        socket.on('new-server-message', handleNewMessage);
        return () => socket.off('new-server-message', handleNewMessage);
    }, [socket, threadId]);

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [replies, loading]);

    const handleSendReply = async () => {
        if (!inputText.trim()) return;

        const messageData = {
            userEmail: user.email,
            username: user.username,
            userAvatar: user.avatar,
            text: inputText,
            type: 'text',
            threadParentId: threadId
        };

        const result = await sendServerMessage(serverId, channelId, messageData);
        if (result) {
            setInputText('');
        }
    };

    const renderMessage = (msg, isParent = false) => {
        const isMe = msg.userEmail === user.email;
        return (
            <div key={msg._id} className={`message ${isMe ? 'me' : 'them'} ${isParent ? 'thread-parent-msg' : ''}`}>
                <div className="message-sender-info">
                    <UserAvatar
                        src={msg.userAvatar}
                        online={false}
                        size="sm"
                    />
                </div>
                <div className="message-content-wrapper">
                    <div className="message-sender-name">
                        {msg.username}
                        {msg.isAI && <span className="bot-badge">BOT</span>}
                        <span className="message-time">{msg.time}</span>
                    </div>
                    <div className="message-bubble">
                        {msg.text}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="thread-sidebar glass-panel">
            <div className="thread-header">
                <div className="thread-header-left">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageSquare size={18} className="text-primary" />
                        <h4>Thread</h4>
                    </div>
                    <button
                        className="summarize-btn"
                        onClick={async () => {
                            try {
                                const res = await fetch(`${config.API_URL}/api/threads/${threadId}/summarize`, {
                                    method: 'POST'
                                });
                                const data = await res.json();
                                if (res.ok) {
                                    showToast(data.summary, "success", 10000);
                                } else {
                                    showToast(data.error || "Failed to summarize", "error");
                                }
                            } catch (e) {
                                showToast("AI is unavailable right now", "error");
                            }
                        }}
                        title="Summarize with AI"
                    >
                        <Wand2 size={14} />
                        <span>Summarize</span>
                    </button>
                </div>
                <button className="icon-btn" onClick={onClose}><X size={20} /></button>
            </div>

            <div className="thread-main-content" ref={chatMessagesRef}>
                {loading ? (
                    <div className="flex-center h-full"><div className="loading-spinner"></div></div>
                ) : (
                    <>
                        {parentMessage && renderMessage(parentMessage, true)}

                        <div className="thread-divider">
                            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                        </div>

                        {replies.map(msg => renderMessage(msg))}
                    </>
                )}
            </div>

            <div className="thread-reply-input">
                <div className="chat-input-area glass-card">
                    <input
                        type="text"
                        placeholder="Reply to thread..."
                        className="chat-input-premium"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendReply();
                            }
                        }}
                    />
                    <button
                        className={`send-btn-vibe ${inputText.trim() ? 'can-send' : ''}`}
                        onClick={handleSendReply}
                        disabled={!inputText.trim()}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThreadSidebar;
