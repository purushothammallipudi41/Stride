import { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, Image, X, Check, CheckCheck, Music } from 'lucide-react';
import socket from '../../services/socket';
import { getTrendingGifs, searchGifs } from '../../services/giphyService';
import { useMusic } from '../../hooks/useMusic';
import './Chat.css';

const ChatWindow = ({ activeChat, onSendMessage, roomId, currentUser }) => {
    const { playTrack, currentTrack, isPlaying } = useMusic();
    const [msgText, setMsgText] = useState('');
    const [showGifs, setShowGifs] = useState(false);
    const [gifSearch, setGifSearch] = useState('');
    const [gifs, setGifs] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        const fetchGifs = async () => {
            try {
                const results = await getTrendingGifs(15);
                setGifs(results);
            } catch (err) {
                console.error("Giphy error:", err);
            }
        };

        if (showGifs) {
            fetchGifs();
        }
    }, [showGifs]);

    useEffect(() => {
        if (!roomId || !currentUser) return;

        const handleTypingStart = ({ username }) => {
            if (username !== currentUser) setOtherUserTyping(true);
        };
        const handleTypingStop = ({ username }) => {
            if (username !== currentUser) setOtherUserTyping(false);
        };
        const handleSeen = ({ messageId, username }) => {
            console.log(`Message ${messageId} seen by ${username}`);
        };

        socket.on('user_typing_start', handleTypingStart);
        socket.on('user_typing_stop', handleTypingStop);
        socket.on('user_message_seen', handleSeen);

        if (activeChat?.messages?.length > 0) {
            const lastMsg = activeChat.messages[activeChat.messages.length - 1];
            socket.emit('message_seen', { roomId, messageId: lastMsg.id, username: currentUser });
        }

        return () => {
            socket.off('user_typing_start', handleTypingStart);
            socket.off('user_typing_stop', handleTypingStop);
            socket.off('user_message_seen', handleSeen);
        };
    }, [roomId, currentUser, activeChat?.messages]);

    const handleInputChange = (e) => {
        const text = e.target.value;
        setMsgText(text);

        if (!isTyping && text.trim()) {
            setIsTyping(true);
            socket.emit('typing_start', { roomId, username: currentUser });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('typing_stop', { roomId, username: currentUser });
        }, 2500);
    };

    const handleGifSearch = async (e) => {
        if (e.key === 'Enter' && gifSearch) {
            const results = await searchGifs(gifSearch, 15);
            setGifs(results);
        }
    };

    const handleSendText = () => {
        if (msgText.trim()) {
            onSendMessage(msgText, 'text');
            setMsgText('');
            setIsTyping(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            socket.emit('typing_stop', { roomId, username: currentUser });
        }
    };

    const handleSendMusic = () => {
        if (currentTrack?.id) {
            onSendMessage(currentTrack, 'music');
        } else {
            onSendMessage("Searching for rhythm...", "text");
        }
    };


    const handleSendGif = (gifUrl) => {
        onSendMessage(gifUrl, 'gif');
        setShowGifs(false);
    };

    if (!activeChat) {
        return (
            <div className="chat-window empty">
                <p>Select a conversation to start chatting</p>
            </div>
        );
    }

    return (
        <div className="chat-window animate-fade-in">
            <div className="chat-header">
                <div className="chat-user-info">
                    <div className="avatar-preview">
                        <img 
                            src={activeChat.avatar || `https://i.pravatar.cc/150?u=${activeChat.username}`} 
                            alt="Avatar" 
                            className="chat-avatar-img" 
                        />
                        <div className="status-indicator online" />
                    </div>
                    <div className="chat-username-block">
                        <span className="chat-username">{activeChat.username}</span>
                        {otherUserTyping && <span className="typing-status">typing...</span>}
                    </div>
                </div>
                <div className="chat-actions">
                    <button className="chat-header-btn"><Phone size={20} /></button>
                    <button className="chat-header-btn"><Video size={20} /></button>
                </div>
            </div>

            <div className="chat-messages">
                {activeChat.messages.map((msg, index) => (
                    <div key={msg.id || index} className={`message ${msg.isMe ? 'me' : 'them'}`}>
                        <div className="message-bubble">
                            {msg.type === 'gif' ? (
                                <img src={msg.gif} alt="GIF" className="chat-gif" />
                            ) : msg.type === 'music' ? (
                                <div className="music-message-card" onClick={() => msg.track && playTrack(msg.track)}>
                                    <div className="music-icon-bubble">
                                        {currentTrack?.id === msg.track?.id && isPlaying ? (
                                            <div className="playing-pulse" />
                                        ) : (
                                            <Music size={18} />
                                        )}
                                    </div>
                                    <div className="music-card-info">
                                        <span className="shared-label">Shared a track</span>
                                        <span className="track-name">{msg.track?.title || msg.text}</span>
                                        <span className="track-artist">{msg.track?.artist || 'Audius Artist'}</span>
                                    </div>
                                </div>
                            ) : (
                                msg.text
                            )}
                        </div>
                        <div className="message-meta">
                            <span className="message-time">{msg.time}</span>
                            {msg.isMe && (
                                <span className={`status-tag ${msg.readStatus ? 'seen' : 'delivered'}`}>
                                    {msg.readStatus ? (
                                        <><CheckCheck size={14} className="status-icon" /> Seen</>
                                    ) : (
                                        <><Check size={14} className="status-icon" /> Sent</>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showGifs && (
                <div className="gif-selector-overlay">
                    <div className="gif-selector-header">
                        <input 
                            type="text" 
                            placeholder="Search GIFs..." 
                            value={gifSearch}
                            onChange={(e) => setGifSearch(e.target.value)}
                            onKeyDown={handleGifSearch}
                        />
                        <button onClick={() => setShowGifs(false)}><X size={18} /></button>
                    </div>
                    <div className="gif-results-grid">
                        {gifs.map(gif => (
                            <img 
                                key={gif.id} 
                                src={gif.images.fixed_height_small.url} 
                                alt={gif.title} 
                                onClick={() => handleSendGif(gif.images.fixed_height.url)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="chat-input-area">
                <button className="chat-action-btn" onClick={() => setShowGifs(!showGifs)}>
                    <Image size={22} color={showGifs ? '#ec4899' : 'currentColor'} />
                </button>
                <button className="chat-action-btn" onClick={handleSendMusic}>
                    <Music size={22} className="text-gradient" />
                </button>
                <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="chat-input" 
                    value={msgText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                />
                <button 
                    className="send-btn" 
                    onClick={handleSendText} 
                    disabled={!msgText.trim()}
                    style={{ opacity: msgText.trim() ? 1 : 0.5 }}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;
