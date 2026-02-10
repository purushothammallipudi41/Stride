import { useState, useEffect } from 'react';
import config from '../config';
import { useSearchParams } from 'react-router-dom';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { useAuth } from '../context/AuthContext';

const Messages = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const targetEmail = searchParams.get('user');

    const [activeChatId, setActiveChatId] = useState(targetEmail);
    const [allUsers, setAllUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const [usersRes, messagesRes] = await Promise.all([
                    fetch(`${config.API_URL}/api/users`),
                    fetch(`${config.API_URL}/api/messages/${user.email}`)
                ]);

                if (usersRes.ok && messagesRes.ok) {
                    const usersData = await usersRes.json();
                    const messagesData = await messagesRes.json();
                    setAllUsers(usersData);
                    setMessages(messagesData);
                }
            } catch (err) {
                console.error('Failed to fetch messages data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll for new messages
        return () => clearInterval(interval);
    }, [user]);

    // Handle initial target focus
    useEffect(() => {
        if (targetEmail) setActiveChatId(targetEmail);
    }, [targetEmail]);

    // Group messages into chats
    const chats = allUsers
        .filter(u => u.email !== user?.email)
        .map(otherUser => {
            const threadMessages = messages.filter(m =>
                (m.from === user.email && m.to === otherUser.email) ||
                (m.from === otherUser.email && m.to === user.email)
            ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            const lastMsg = threadMessages[threadMessages.length - 1];

            return {
                id: otherUser.email,
                username: otherUser.username,
                name: otherUser.name,
                avatar: otherUser.avatar,
                lastMessage: lastMsg ? (lastMsg.sharedContent ? `Shared a ${lastMsg.sharedContent.type}` : lastMsg.text) : "Start a conversation",
                time: lastMsg ? lastMsg.time : "",
                messages: threadMessages.map(m => ({
                    ...m,
                    isMe: m.from === user.email
                }))
            };
        })
        .filter(chat => chat.messages.length > 0 || chat.id === targetEmail) // Show chats with history OR current target
        .sort((a, b) => {
            const timeA = a.messages[a.messages.length - 1]?.timestamp || 0;
            const timeB = b.messages[b.messages.length - 1]?.timestamp || 0;

            // Put current target at the absolute top if they are active
            if (a.id === activeChatId) return -1;
            if (b.id === activeChatId) return 1;

            return new Date(timeB) - new Date(timeA);
        });

    const activeChat = chats.find(c => c.id === activeChatId);

    const handleSendMessage = async (content, type = 'text') => {
        if (!activeChatId || !user) return;

        try {
            const res = await fetch(`${config.API_URL}/api/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: user.email,
                    to: activeChatId,
                    text: type === 'text' ? content : '',
                    sharedContent: type === 'gif' ? { type: 'gif', thumbnail: content } : null
                })
            });

            if (res.ok) {
                const newMessage = await res.json();
                setMessages(prev => [...prev, newMessage]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    if (loading) return <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>Loading chats...</div>;

    return (
        <div className={`page-container messages-page ${activeChatId ? 'show-chat' : 'show-list'}`} style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            <ChatList
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={(chat) => setActiveChatId(chat.id)}
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
