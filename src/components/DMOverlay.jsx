
import React, { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import ChatWindow from './chat/ChatWindow';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import './DMOverlay.css'; // We'll create this CSS file next

const DMOverlay = ({ targetUser, onClose, minimized, onToggleMinimize }) => {
    const { user } = useAuth();
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!targetUser || !user) return;

        const loadChat = async () => {
            setLoading(true);
            try {
                const [messagesRes, convosRes] = await Promise.all([
                    fetch(`${config.API_URL}/api/messages/${user.email}`),
                    fetch(`${config.API_URL}/api/conversations/${user.email}`)
                ]);

                if (messagesRes.ok && convosRes.ok) {
                    const messagesData = await messagesRes.json();
                    const convosData = await convosRes.json();
                    const convo = convosData.find(c => c.participants.includes(targetUser.email));

                    const relevantMessages = messagesData.filter(m =>
                        (m.from === user.email && m.to === targetUser.email) ||
                        (m.from === targetUser.email && m.to === user.email)
                    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                    setActiveChat({
                        id: targetUser.email,
                        conversationId: convo?._id,
                        username: targetUser.username,
                        name: targetUser.name,
                        avatar: targetUser.avatar,
                        isOfficial: targetUser.isOfficial,
                        messages: relevantMessages.map(m => ({
                            ...m,
                            isMe: m.from === user.email,
                            senderName: m.username,
                            senderAvatar: m.userAvatar
                        }))
                    });
                }
            } catch (err) {
                console.error("Failed to load DM overlay chat", err);
            } finally {
                setLoading(false);
            }
        };

        loadChat();
    }, [targetUser, user]);

    // Handle real-time updates from socket
    const { socket } = useSocket();
    useEffect(() => {
        if (!socket || !activeChat) return;

        const handleNewMessage = (msg) => {
            if ((msg.from === user.email && msg.to === targetUser.email) ||
                (msg.from === targetUser.email && msg.to === user.email)) {

                // Emit delivered status
                if (msg.from !== user.email) {
                    socket.emit('message-delivered', {
                        messageId: msg._id,
                        fromId: user.id
                    });
                }

                setActiveChat(prev => ({
                    ...prev,
                    messages: [...prev.messages, {
                        ...msg,
                        isMe: msg.from === user.email,
                        senderName: msg.username,
                        senderAvatar: msg.userAvatar
                    }]
                }));
            }
        };

        socket.on('direct-message', handleNewMessage);
        return () => socket.off('direct-message');
    }, [socket, activeChat, targetUser.email, user.email]);

    const handleSendMessage = async (content, type = 'text') => {
        if (!user || !targetUser) return;
        try {
            const msgData = {
                from: user.email,
                to: targetUser.email,
                text: type === 'text' ? content : '',
                sharedContent: type === 'gif' ? { type: 'gif', thumbnail: content } : null
            };

            await fetch(`${config.API_URL}/api/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msgData)
            });

            // Optimistic update already handled by socket if backend broadcasts back to sender
            // or we add it here manually if needed.
        } catch (e) {
            console.error("Send failed", e);
        }
    };

    if (minimized) {
        return (
            <div className="dm-overlay-minimized" onClick={onToggleMinimize}>
                <div className="minimized-avatar" style={{ backgroundImage: `url(${targetUser.avatar})` }} />
                <span className="minimized-name">{targetUser.name}</span>
                <button className="icon-btn-small" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                    <X size={14} />
                </button>
            </div>
        );
    }

    return (
        <div className="dm-overlay-window glass-card animate-in scale-up">
            <div className="dm-overlay-header">
                <div className="header-user">
                    <div className="header-avatar" style={{ backgroundImage: `url(${targetUser.avatar})` }} />
                    <div className="header-info">
                        <span className="header-username">{targetUser.username}</span>
                        <span className="header-status">Direct Message</span>
                    </div>
                </div>
                <div className="header-controls">
                    <button className="icon-btn" onClick={onToggleMinimize}>
                        <Minimize2 size={18} />
                    </button>
                    <button className="icon-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="dm-overlay-content">
                {loading && !activeChat ? (
                    <div className="dm-loading">Loading...</div>
                ) : (
                    <ChatWindow
                        activeChat={activeChat || {
                            username: targetUser.username,
                            messages: [],
                            avatar: targetUser.avatar
                        }}
                        onSendMessage={handleSendMessage}
                        showHeader={false} // We typically hide standard header since we have overlay header
                    // Pass mock props if needed
                    />
                )}
            </div>
        </div>
    );
};

export default DMOverlay;
