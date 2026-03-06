import { useState, useEffect } from 'react';
import config from '../config';
import './Messages.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';


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
    const [peerPublicKeys, setPeerPublicKeys] = useState({});

    const { socket } = useSocket();
    const { encryptMessage, decryptMessage, isE2EEEnabled } = useSecurity();


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
                let messagesData = await messagesRes.json();
                const convosData = await convosRes.json();

                // Decrypt history
                messagesData = await decryptBatch(messagesData, usersData);

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

    const getPeerPublicKey = async (email) => {
        // Handled by SecurityContext internally now, but keeping for direct fetch if needed
        if (peerPublicKeys[email]) return peerPublicKeys[email];
        try {
            const res = await fetch(`${config.API_URL}/api/users/${email}/public-key`);
            if (res.ok) {
                const data = await res.json();
                if (data.publicKey) {
                    setPeerPublicKeys(prev => ({ ...prev, [email]: data.publicKey }));
                    return data.publicKey;
                }
            }
        } catch (err) { }
        return null;
    };


    const decryptBatch = async (msgs) => {
        const decrypted = await Promise.all(msgs.map(async (m) => {
            if (m.text && m.text.includes('"encrypted":true')) {
                const otherEmail = m.from === user.email ? m.to : m.from;
                const decryptedText = await decryptMessage(m.text, otherEmail);
                return { ...m, text: decryptedText, isE2EE: true };
            }
            return m;
        }));
        return decrypted;
    };


    useEffect(() => {
        fetchData();
    }, [user]);

    // Socket.io Real-time Updates
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = async (newMessage) => {
            const otherEmail = newMessage.from === user.email ? newMessage.to : newMessage.from;
            let pubKey = peerPublicKeys[otherEmail];
            if (!pubKey) pubKey = await getPeerPublicKey(otherEmail);

            let decryptedMsg = newMessage;
            if (newMessage.text && newMessage.text.includes('"encrypted":true')) {
                const decryptedText = await decryptMessage(newMessage.text, otherEmail);
                decryptedMsg = { ...newMessage, text: decryptedText, isE2EE: true };
            }


            setMessages(prev => {
                if (prev.find(m => m._id === decryptedMsg._id)) return prev;
                return [...prev, decryptedMsg];
            });

            // Emit delivered status back to sender
            if (decryptedMsg.from !== user.email) {
                socket.emit('message-delivered', {
                    messageId: decryptedMsg._id,
                    fromId: user.id
                });
            }

            // Re-fetch conversations to update last message preview / ordering
            fetch(`${config.API_URL}/api/conversations/${user.email}`)
                .then(res => res.json())
                .then(async (data) => {
                    // Pre-decrypt last message if possible
                    const enriched = await Promise.all(data.map(async (c) => {
                        if (c.lastMessage?.text?.includes('"encrypted":true')) {
                            const oEmail = c.participants.find(p => p !== user.email);
                            let pk = peerPublicKeys[oEmail] || await getPeerPublicKey(oEmail);
                            if (pk) {
                                c.lastMessage.text = await encryptionService.decrypt(c.lastMessage.text, pk);
                            }
                        }
                        return c;
                    }));
                    setConversations(enriched);
                })
                .catch(err => console.error('Failed to update convos:', err));
        };

        const handleStatusUpdate = ({ messageId, status }) => {
            setMessages(prev => prev.map(m =>
                (m._id === messageId || m.id === messageId) ? { ...m, status } : m
            ));
        };

        const handlePollUpdate = (updatedMsg) => {
            setMessages(prev => prev.map(m => (m._id === updatedMsg._id || m.id === updatedMsg._id) ? updatedMsg : m));
        };

        socket.on('receive-message', handleNewMessage);
        socket.on('msg-status-update', handleStatusUpdate);
        socket.on('poll-update', handlePollUpdate);

        return () => {
            socket.off('receive-message', handleNewMessage);
            socket.off('msg-status-update', handleStatusUpdate);
            socket.off('poll-update', handlePollUpdate);
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
            activeAvatarFrame: otherUser.activeAvatarFrame,
            isMuted: settings.isMuted,
            lastMessage: (convo.lastMessage?.text === 'Shared undefined' ? 'Shared Location' : convo.lastMessage?.text) || "No messages",
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

    const activeChat = chats.find(c => c.id === activeChatId);

    const handleSendMessage = async (text, type = 'text', extraData = null) => {
        if (!activeChatId || !user || !activeChat) return;

        const targetEmail = activeChat.email || activeChatId;

        let finalOutput = text;
        let isE2EE = false;

        if (type === 'text') {
            const encrypted = await encryptMessage(text, targetEmail);
            if (encrypted !== text) {
                finalOutput = encrypted;
                isE2EE = true;
            }
        }


        const messageBody = {
            from: user.email,
            to: targetEmail,
            text: finalOutput,
            type,
            sharedContent: type === 'poll' ? extraData : (type !== 'text' ? extraData : null),
            poll: type === 'poll' ? extraData : null,
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

    const handleDeleteMessage = async (msg) => {
        const msgId = msg._id || msg.id;
        try {
            const res = await fetch(`${config.API_URL}/api/messages/${msgId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setMessages(prev => prev.filter(m => (m._id || m.id) !== msgId));
                // Notify via socket so other user sees it deleted too
                if (socket) {
                    socket.emit('delete-direct-message', {
                        messageId: msgId,
                        to: activeChat.email
                    });
                }
            }
        } catch (error) {
            console.error('Failed to delete message:', error);
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
                onDelete={handleDeleteMessage}
                onBack={() => setActiveChatId(null)}
                isDirect={true}
            />
        </div>
    );
};

export default Messages;
