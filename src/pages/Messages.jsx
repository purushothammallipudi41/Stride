import { useState, useEffect } from 'react';
import socket from '../services/socket';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import PageHeader from '../components/layout/PageHeader';
import { useUI } from '../hooks/useUI';

const Messages = () => {
    const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
    const [chats, setChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { resetMessages } = useUI();

    useEffect(() => {
        resetMessages();
    }, [resetMessages]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/messages`)
            .then(res => res.json())
            .then(data => {
                setChats(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch messages:", err);
                setIsLoading(false);
            });
    }, []);

    const [activeChatId, setActiveChatId] = useState(null);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const activeChat = chats.find(c => c.id === activeChatId);

    useEffect(() => {
        if (!activeChatId) return;
        
        socket.emit('join_room', `chat_${activeChatId}`);

        const handleNewMessage = (msg) => {
            setChats(prevChats => prevChats.map(chat => {
                if (chat.id === activeChatId) {
                    return {
                        ...chat,
                        messages: [...chat.messages, { ...msg, isMe: msg.username === userProfile.username }],
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

        const handleSeen = ({ messageId, username: seenBy }) => {
            if (seenBy === userProfile.username) return; // Ignore own seen events

            setChats(prevChats => prevChats.map(chat => {
                if (chat.id === activeChatId) {
                    return {
                        ...chat,
                        messages: chat.messages.map(m => 
                            (m.id === messageId || (!messageId && m.username === userProfile.username)) 
                                ? { ...m, readStatus: true } 
                                : m
                        )
                    };
                }
                return chat;
            }));
        };

        socket.on('new_private_message', handleNewMessage);
        socket.on('user_typing_start', handleTypingStart);
        socket.on('user_typing_stop', handleTypingStop);
        socket.on('user_message_seen', handleSeen);

        return () => {
            socket.off('new_private_message', handleNewMessage);
            socket.off('user_typing_start', handleTypingStart);
            socket.off('user_typing_stop', handleTypingStop);
            socket.off('user_message_seen', handleSeen);
        };

    }, [activeChatId, userProfile.username]);



    const handleSendMessage = (content, type = 'text') => {
        if (!activeChatId) return;

        const newMessage = {
            [type === 'text' ? 'text' : 'gif']: content,
            username: userProfile.username || 'Anonymous',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type
        };

        socket.emit('private_message', {
            roomId: `chat_${activeChatId}`,
            message: newMessage
        });
    };

    if (isLoading) return <div className="loading-screen">Intercepting waves...</div>;

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <PageHeader title="Direct Messages" />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <ChatList
                    chats={chats}
                    activeChatId={activeChatId}
                    onSelectChat={(chat) => setActiveChatId(chat.id)}
                    typingUsers={typingUsers}
                />

                <ChatWindow 
                    activeChat={activeChat} 
                    onSendMessage={handleSendMessage}
                    roomId={`chat_${activeChatId}`}
                    currentUser={userProfile.username}
                />
            </div>
        </div>
    );
};

export default Messages;
