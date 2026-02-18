
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
                // Fetch full user details if needed, or just use targetUser
                // Fetch existing messages
                const [messagesRes, convosRes] = await Promise.all([
                    fetch(`${config.API_URL}/api/messages/${user.email}`),
                    fetch(`${config.API_URL}/api/conversations/${user.email}`)
                ]);

                if (messagesRes.ok && convosRes.ok) {
                    const messagesData = await messagesRes.json();
                    const convosData = await convosRes.json();

                    // Find convo
                    const convo = convosData.find(c => c.participants.includes(targetUser.email));

                    // Filter messages
                    const relevantMessages = messagesData.filter(m =>
                        (m.from === user.email && m.to === targetUser.email) ||
                        (m.from === targetUser.email && m.to === user.email)
                    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                    // Construct chat object compatible with ChatWindow
                    const chatObj = {
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
                    };
                    setActiveChat(chatObj);
                }
            } catch (err) {
                console.error("Failed to load DM overlay chat", err);
            } finally {
                setLoading(false);
            }
        };

        loadChat();
        // Poll for new messages every 3s while open
        const interval = setInterval(loadChat, 3000);
        return () => clearInterval(interval);
    }, [targetUser, user]);

    const handleSendMessage = async (content, type = 'text') => {
        if (!user || !targetUser) return;
        try {
            await fetch(`${config.API_URL}/api/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: user.email,
                    to: targetUser.email,
                    text: type === 'text' ? content : '',
                    sharedContent: type === 'gif' ? { type: 'gif', thumbnail: content } : null
                })
            });
            // Polling will pick it up, or we canoptimistically update
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
