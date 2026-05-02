import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import socket from '../services/socket';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import PageHeader from '../components/layout/PageHeader';
import { useUI } from '../hooks/useUI';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import '../components/chat/Chat.css';

const Messages = () => {
    const userProfile = getStoredUser();
    const location = useLocation();
    const openUsername = location.state?.openUsername;
    const [chats, setChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { resetMessages, setCallInfo } = useUI();
    const [activeChatId, setActiveChatId] = useState(null);
    const [typingUsers, setTypingUsers] = useState(new Set());

    // Helper to generate deterministic IDs matching the server logic
    const getChatId = (u1, u2) => [u1, u2].sort().join('-');

    useEffect(() => {
        resetMessages();
    }, [resetMessages]);

    useEffect(() => {
        fetch(`${BASE_URL}/api/messages`)
            .then(res => res.json())
            .then(data => {
                // Determine the "other" person for each chat thread relative to current user
                const processed = data.map(chat => {
                    if (chat.participants) {
                        const otherPerson = chat.participants.find(p => p !== userProfile.username) || userProfile.username;
                        
                        // Hydrate message history with frontend 'isMe' identifier for styling
                        const hydratedMessages = (chat.messages || []).map(msg => ({
                            ...msg,
                            isMe: msg.username === userProfile.username
                        }));

                        return { ...chat, username: otherPerson, messages: hydratedMessages };
                    }
                    return chat;
                });
                setChats(processed);
                setIsLoading(false);

                // Auto-open conversation if navigated from a profile
                if (openUsername) {
                    const existing = processed.find(c => c.username === openUsername);
                    if (existing) {
                        setActiveChatId(existing.id);
                    } else {
                        // Create a fresh empty thread so the user can start typing
                        const newChat = {
                            id: getChatId(userProfile.username, openUsername),
                            username: openUsername,
                            name: openUsername,
                            avatar: "",

                            messages: [],
                            lastMessage: '',
                            time: ''
                        };
                        setChats(prev => [newChat, ...prev]);
                        setActiveChatId(newChat.id);
                    }
                }
            })
            .catch(err => {
                console.error("Failed to fetch messages:", err);
                setIsLoading(false);
            });
    }, [openUsername]);

    const activeChat = chats.find(c => c.id === activeChatId);

    useEffect(() => {
        if (!activeChatId) return;
        
        socket.emit('join_room', `chat_${activeChatId}`);

        const handleNewMessage = (msg) => {
            // CRITICAL: Filter out our own messages to prevent duplication (Optimistic UI handle it)
            if (msg.username === userProfile.username) return;

            setChats(prevChats => prevChats.map(chat => {
                if (chat.id === activeChatId) {
                    const isMe = msg.username === userProfile.username;
                    return {
                        ...chat,
                        messages: [...(chat.messages || []), { ...msg, isMe, id: Date.now() }],
                        lastMessage: msg.text || 'Sent an attachment',
                        time: 'Now'
                    };
                }
                return chat;
            }));
        };

        const handleTypingStart = ({ username }) => {
            if (username !== userProfile.username) {
                setTypingUsers(prev => new Set(prev).add(username));
            }
        };

        const handleTypingStop = ({ username }) => {
            setTypingUsers(prev => {
                const next = new Set(prev);
                next.delete(username);
                return next;
            });
        };

        const handleVibeUpdated = ({ messageId, reactions }) => {
            setChats(prevChats => prevChats.map(chat => {
                if (chat.id === activeChatId) {
                    return {
                        ...chat,
                        messages: chat.messages.map(m => m.id === messageId ? { ...m, reactions } : m)
                    };
                }
                return chat;
            }));
        };

        socket.on('new_private_message', handleNewMessage);
        socket.on('user_typing_start', handleTypingStart);
        socket.on('user_typing_stop', handleTypingStop);
        socket.on('message_vibe_updated', handleVibeUpdated);

        return () => {
            socket.off('new_private_message', handleNewMessage);
            socket.off('user_typing_start', handleTypingStart);
            socket.off('user_typing_stop', handleTypingStop);
            socket.off('message_vibe_updated', handleVibeUpdated);
        };

    }, [activeChatId, userProfile.username]);

    const handleSendMessage = (content, type = 'text') => {
        if (!activeChatId) return;

        const newMessage = {
            text: content,
            username: userProfile.username || 'Anonymous',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type,
            isMe: true,
            id: 'optimistic-' + Date.now()
        };

        // Optimistic update for sender's UI
        setChats(prevChats => prevChats.map(chat => {
            if (chat.id === activeChatId) {
                return {
                    ...chat,
                    messages: [...(chat.messages || []), newMessage],
                    lastMessage: newMessage.text || 'Sent an attachment',
                    time: 'Now'
                };
            }
            return chat;
        }));
        // Robustly determine actual recipient
        const currentChat = chats.find(c => c.id === activeChatId);
        const recipient = currentChat ? currentChat.username : activeChatId;

        socket.emit('private_message', {
            roomId: `chat_${activeChatId}`,
            recipient: recipient,
            message: newMessage
        });
    };

    const handleStartCall = (type) => {
        if (!activeChat) return;
        
        setCallInfo({
            isOpen: true,
            isIncoming: false,
            callerData: {
                username: activeChat.username,
                name: activeChat.name || activeChat.username
            },
            type
        });
        
        socket.emit('start-direct-call', {
            username: activeChat.username,
            name: activeChat.name || activeChat.username,
            type
        });
    };

    if (isLoading) return <div className="loading-screen">Intercepting waves...</div>;

    return (
        <div className="messages-full-view">
            <div className={`chat-list-wrapper ${activeChatId ? 'hidden-mobile' : ''}`}>
                <ChatList
                    chats={chats}
                    activeChatId={activeChatId}
                    onSelectChat={(chat) => setActiveChatId(chat.id)}
                    typingUsers={typingUsers}
                    currentUser={userProfile.username}
                />
            </div>

            <div className={`chat-window-wrapper ${!activeChatId ? 'hidden-mobile' : ''}`}>
                <ChatWindow 
                    activeChat={activeChat} 
                    onSendMessage={handleSendMessage}
                    onStartCall={handleStartCall}
                    roomId={`chat_${activeChatId}`}
                    currentUser={userProfile.username}
                    onBack={() => setActiveChatId(null)}
                    typingUsers={typingUsers}
                />
            </div>
        </div>
    );
};

export default Messages;
