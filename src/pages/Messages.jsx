import { useState, useEffect } from 'react';
import config from '../config';
import './Messages.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft } from 'lucide-react';

const Messages = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetEmail = searchParams.get('user');

    const [activeChatId, setActiveChatId] = useState(targetEmail);
    const [allUsers, setAllUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    const { socket } = useSocket();

    const fetchData = async () => {
        if (!user) return;
        try {
            const [usersRes, messagesRes, convosRes] = await Promise.all([
                fetch(`${config.API_URL}/api/users`),
                fetch(`${config.API_URL}/api/messages/${user.email}`),
                fetch(`${config.API_URL}/api/conversations/${user.email}`)
            ]);

            if (usersRes.ok && messagesRes.ok && convosRes.ok) {
                const usersData = await usersRes.json();
                const messagesData = await messagesRes.json();
                const convosData = await convosRes.json();
                setAllUsers(usersData);
                setMessages(messagesData);
                setConversations(convosData);
            }
        } catch (err) {
            console.error('Failed to fetch messages data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Socket.io Real-time Updates
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            setMessages(prev => {
                if (prev.find(m => m._id === newMessage._id)) return prev;
                return [...prev, newMessage];
            });

            // Emit delivered status back to sender
            if (newMessage.from !== user.email) {
                socket.emit('message-delivered', {
                    messageId: newMessage._id,
                    fromId: user.id
                });
            }

            // Re-fetch conversations to update last message preview / ordering
            fetch(`${config.API_URL}/api/conversations/${user.email}`)
                .then(res => res.json())
                .then(data => setConversations(data))
                .catch(err => console.error('Failed to update convos:', err));
        };

        const handleStatusUpdate = ({ messageId, status }) => {
            setMessages(prev => prev.map(m =>
                (m._id === messageId || m.id === messageId) ? { ...m, status } : m
            ));
        };

        socket.on('receive-message', handleNewMessage);
        socket.on('msg-status-update', handleStatusUpdate);

        return () => {
            socket.off('receive-message', handleNewMessage);
            socket.off('msg-status-update', handleStatusUpdate);
        };
    }, [socket, user]);

    // Handle initial target focus
    useEffect(() => {
        if (targetEmail) setActiveChatId(targetEmail);
    }, [targetEmail]);

    // Map conversations to chats
    const existingChats = conversations.map(convo => {
        const otherEmail = convo.participants.find(p => p !== user.email);
        const otherUser = allUsers.find(u => u.email === otherEmail) || {
            email: otherEmail,
            username: otherEmail ? otherEmail.split('@')[0] : 'User'
        };

        const settings = convo.settings.find(s => s.email === user.email) || {};
        const lastCleared = settings.lastClearedAt ? new Date(settings.lastClearedAt) : null;

        const threadMessages = messages.filter(m => {
            const isRelevant = (m.from === user.email && m.to === otherEmail) ||
                (m.from === otherEmail && m.to === user.email);
            if (!isRelevant) return false;
            if (lastCleared && new Date(m.timestamp) <= lastCleared) return false;
            return true;
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return {
            id: otherEmail,
            conversationId: convo._id,
            username: otherUser.username,
            name: otherUser.name,
            avatar: otherUser.avatar,
            isMuted: settings.isMuted,
            lastMessage: convo.lastMessage?.text || "No messages",
            time: convo.lastMessage ? new Date(convo.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
            messages: threadMessages.map(m => ({
                ...m,
                isMe: m.from === user.email,
                senderName: m.from === user.email ? user.username : otherUser.username,
                senderAvatar: m.from === user.email ? user.avatar : otherUser.avatar
            }))
        };
    });

    // If targetEmail is specified but not in conversations, add a virtual chat
    let chats = [...existingChats];
    if (targetEmail && !existingChats.find(c => c.id === targetEmail)) {
        const targetUser = allUsers.find(u => u.email === targetEmail) || {
            email: targetEmail,
            username: targetEmail ? targetEmail.split('@')[0] : 'User'
        };
        chats.unshift({
            id: targetEmail,
            isVirtual: true,
            username: targetUser.username,
            name: targetUser.name,
            avatar: targetUser.avatar,
            lastMessage: "Start a conversation",
            time: "",
            messages: []
        });
    }

    chats.sort((a, b) => {
        if (a.id === activeChatId) return -1;
        if (b.id === activeChatId) return 1;
        return 0;
    });

    const handleSendMessage = async (text, type = 'text', extraData = null) => {
        if (!activeChatId || !user) return;

        const messageBody = {
            from: user.email,
            to: activeChatId,
            text,
            type,
            sharedContent: type !== 'text' ? extraData : null,
            replyTo: extraData?.replyTo || null,
            timestamp: new Date().toISOString()
        };

        try {
            const res = await fetch(`${config.API_URL}/api/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageBody)
            });

            if (res.ok) {
                const newMessage = await res.json();
                setMessages(prev => {
                    if (prev.find(m => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });
                // Re-fetch conversations to update last message preview / ordering
                fetch(`${config.API_URL}/api/conversations/${user.email}`)
                    .then(res => res.json())
                    .then(data => setConversations(data))
                    .catch(err => console.error('Failed to update convos:', err));
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleConvoAction = async (convoId, action) => {
        if (!convoId) {
            if (action === 'hide' || action === 'delete') {
                setActiveChatId(null);
                navigate('/messages');
            }
            return;
        }

        try {
            const res = await fetch(`${config.API_URL}/api/conversations/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: convoId, userEmail: user.email, action })
            });
            if (res.ok) {
                fetchData();
                if (action === 'hide' || action === 'delete') {
                    setActiveChatId(null);
                    navigate('/messages');
                }
            }
        } catch (err) {
            console.error('Action failed:', err);
        }
    };

    const activeChat = chats.find(c => c.id === activeChatId);

    if (loading) return <div className="page-container flex-center" style={{ color: 'white' }}>Loading chats...</div>;

    return (
        <div className={`page-container messages-page ${activeChatId ? 'show-chat' : 'show-list'}`} style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            <ChatList
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={(chat) => setActiveChatId(chat.id)}
                onConvoAction={handleConvoAction}
                onBack={() => navigate('/')}
            />
            <ChatWindow
                activeChat={activeChat || null}
                onSendMessage={handleSendMessage}
                onBack={() => setActiveChatId(null)}
            />
        </div>
    );
};

export default Messages;
