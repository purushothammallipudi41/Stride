import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Video, Image as ImageIcon, ChevronLeft, Mic, Plus, Smile as SmileIcon, Camera, MessageSquare, Search, Check, CheckCheck, Users, Gavel, Zap, Edit } from 'lucide-react';
import { useUI } from '../../hooks/useUI';
import socket from '../../services/socket';
import Avatar from '../common/Avatar';
import VerificationBadge from '../common/VerificationBadge';
import { BASE_URL } from '../../utils/api';
import './Chat.css';

const ChatWindow = ({ activeChat, onSendMessage, onStartCall, roomId, currentUser, onBack, isDisabled, hideCallButtons, typingUsers, communityStats }) => {
    const { openExplorer } = useUI();
    const [msgText, setMsgText] = useState('');
    const [showGifs, setShowGifs] = useState(false);
    const [isGifMode, setIsGifMode] = useState(false);
    const [gifSearch, setGifSearch] = useState('');
    const [gifs, setGifs] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Trending');
    const [isLoadingGifs, setIsLoadingGifs] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordTime, setRecordTime] = useState(0);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const [showStoryMode, setShowStoryMode] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const [audioData, setAudioData] = useState(new Uint8Array(0));
    const [longPressedMsg, setLongPressedMsg] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const audioStreamRef = useRef(null);

    const GIPHY_API_KEY = 'L8S8CWv6I6I05A0A101';
    
    // Bulletproof Social Archive: Category-specific unique sets
    const CATEGORY_FALLBACKS = {
        'Trending': [
            { id: 'l0MYt5jPR6QX5pnqM', title: 'Celebrate' }, { id: 'GpyS1lJXJYupG', title: 'Laugh' }, { id: 'PUBxelwT57jsQ', title: 'Wow' }
        ],
        'Reactions': [
            { id: 'Fu3OjBQiCs3s0ZuLY3', title: 'Like' }, { id: 'uUIFcDYRbvJTtxaFNa', title: 'What' }, { id: 'Ru9sjtZ09XOEg', title: 'Yes' }
        ],
        'Love': [
            { id: 'azi3GTPtxWKCQ', title: 'Hearts' }, { id: '7J4WxAd5J9nLLMYKmA', title: 'Together' }, { id: 'RJObHnqqPzPskPIvI8', title: 'Hug' }
        ],
        'Happy': [
            { id: 'cXblnKXr2BQOaYnTni', title: 'Smile' }, { id: 'IAbrtESCyrqLOMlWdx', title: 'Joy' }, { id: 'fUQ4rhUZJYiQsas6WD', title: 'Dance' }
        ],
        'Sad': [
            { id: 'H6cmWzp6LGFvqjidB7', title: 'Cry' }, { id: '4V3RuU0zSq1SC8Hh4x', title: 'Rain' }, { id: 'mBaNKEmk9SUKs', title: 'Sigh' }
        ],
        'Dance': [
            { id: 'ujTVMASREzuRbH6zy5', title: 'Disco' }, { id: '9gMVPuOKoOxGpbxCm7', title: 'Move' }, { id: 'oF6TOssuzqVmbYE70d', title: 'Party' }
        ],
        'Angry': [
            { id: '3ohs81rDuEz9ioJzAA', title: 'Rage' }, { id: 'm8fyrgnXwXV5EHw6Lm', title: 'No' }, { id: 'OHRF8LZis06OiPDJby', title: 'Mad' }
        ],
        'Wow': [
            { id: 'oYtVHSxngR3lC', title: 'OMG' }, { id: 'QUENDfi6DEMLzQ0CKt', title: 'Brain' }, { id: '9sJ7ZldhfGyn4KuOyP', title: 'Shock' }
        ],
        'Memes': [
            { id: 'e6PwP26WNDO3bBVQ2t', title: 'Rick' }, { id: 'Lopx9eUi34rbq', title: 'High' }, { id: 'kKolzIJEy8xXXm0544', title: 'Lol' }
        ],
        'Meme': [
            { id: 'e6PwP26WNDO3bBVQ2t', title: 'Rick' }, { id: 'Lopx9eUi34rbq', title: 'High' }, { id: 'kKolzIJEy8xXXm0544', title: 'Lol' }
        ],
        'Music': [
            { id: 'q618imRRVODIMoznGC', title: 'Beat' }, { id: 'hiLLD9o1wTB3a', title: 'Dance' }, { id: 'gQJyPqc6E4xoc', title: 'Sound' }
        ]
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!isGifMode) return;
        
        const fetchGifs = async () => {
            setIsLoadingGifs(true);
            try {
                let url;
                if (gifSearch) {
                    url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(gifSearch)}&limit=50&rating=pg`;
                } else if (selectedCategory !== 'Trending') {
                    url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(selectedCategory)}&limit=50&rating=pg`;
                } else {
                    url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=50&rating=pg`;
                }
                
                const resp = await fetch(url);
                const data = await resp.json();
                
                if (data.data && data.data.length > 0) {
                    setGifs(data.data);
                } else {
                    // Use category-specific fallbacks if API returns empty
                    console.warn(`Giphy API empty for ${selectedCategory}, using social archive`);
                    setGifs(CATEGORY_FALLBACKS[selectedCategory] || CATEGORY_FALLBACKS['Trending']);
                }
            } catch (err) {
                console.error("Giphy Fetch Error, reverting to social archive:", err);
                setGifs(CATEGORY_FALLBACKS[selectedCategory] || CATEGORY_FALLBACKS['Trending']);
            } finally {
                setIsLoadingGifs(false);
            }
        };

        // Clear previous results immediately to provide snappy transitions
        if (!gifSearch) setGifs([]);
        
        const timer = setTimeout(fetchGifs, gifSearch ? 500 : 0);
        return () => clearTimeout(timer);
    }, [isGifMode, gifSearch, selectedCategory]);

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

        // High-Fidelity Presence Pulse
        if (roomId && currentUser) {
            socket.emit('typing_start', { roomId, username: currentUser });
            
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing_stop', { roomId, username: currentUser });
            }, 2000);
        }
    };

    const handleSendText = () => {
        if (msgText.trim()) {
            onSendMessage(msgText, 'text');
            setMsgText('');
            
            // Hard reset presence on send
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            socket.emit('typing_stop', { roomId, username: currentUser });
        }
    };

    const handlePlusClick = () => {
        setShowGifs(!showGifs);
    };

    const handleCameraClick = () => {
        setPreviewImage(null);
        setShowStoryMode(true);
        startCamera();
    };

    const startCamera = async () => {
        setIsCameraLoading(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' }, 
                audio: false 
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access failed, falling back to OS picker:", err);
            setShowStoryMode(false);
            cameraInputRef.current?.click();
        } finally {
            setIsCameraLoading(false);
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowStoryMode(false);
        setPreviewImage(null);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            
            // Premium capture quality
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            setPreviewImage(dataUrl);
        }
    };

    const handleLocationClick = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            // Send the special token format that the Vyx Map Engine expects
            onSendMessage(`[LOCATION:${latitude},${longitude}]`, 'location');
            setShowGifs(false);
        }, () => {
            alert("Unable to retrieve your location. Please check permissions.");
        });
    };

    const handleGalleryClick = () => {
        fileInputRef.current?.click();
    };



    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Data = event.target.result;
                onSendMessage(base64Data, 'image');
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (isRecording) {
            recordingIntervalRef.current = setInterval(() => {
                setRecordTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(recordingIntervalRef.current);
            setRecordTime(0);
        }
        return () => clearInterval(recordingIntervalRef.current);
    }, [isRecording]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMicClick = () => {
        setShowVoiceRecorder(true);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioCtxRef.current.createAnalyser();
            const source = audioCtxRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 64;
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const drawWave = () => {
                if (!isRecording && !audioStreamRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                setAudioData(new Uint8Array(dataArray));
                requestAnimationFrame(drawWave);
            };
            
            setIsRecording(true);
            drawWave();
        } catch (err) {
            console.error("Mic access denied:", err);
        }
    };

    const stopRecording = (shouldSend = true) => {
        setIsRecording(false);
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
        }
        
        if (shouldSend && recordTime > 0) {
            onSendMessage(`🎤 Voice Message (${formatTime(recordTime)})`, 'text');
        }
        setShowVoiceRecorder(false);
        setAudioData(new Uint8Array(0));
    };

    const handleMessageVibe = async (messageId, emoji) => {
        try {
            const res = await fetch(`${BASE_URL}/api/messages/${messageId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser, emoji })
            });
            const data = await res.json();
            if (data.success) {
                // UI local update if socket doesn't loop back fast enough?
                // For Vyx, we rely on the socket event 'message_vibe_updated' 
                // but we can also emit a pulse immediately for 'WOW' factor
                socket.emit('message_vibe', { roomId, messageId, username: currentUser, emoji });
            }
        } catch (err) {
            console.error("Reaction failed:", err);
        }
        setLongPressedMsg(null);
    };

    if (!activeChat) {
        return (
            <div className="chat-window-v3">
                <div className="empty-chat-placeholder glass-panel">
                    <div className="empty-chat-icon-glow">
                        <MessageSquare size={48} className="text-white" />
                    </div>
                    <h3>Your Messages</h3>
                    <p>Send a private photo or message to a friend.</p>
                    <button 
                        className="chat-tab active" 
                        style={{ marginTop: '20px', padding: '12px 30px' }}
                        onClick={() => openExplorer()}
                    >
                        Send Message
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`chat-window-v3 animate-fade-in ${isDisabled ? 'disabled' : ''}`}>
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileChange}
            />
            <input 
                type="file" 
                ref={cameraInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
            />

            <div className="chat-header-glass">
                <div className="chat-header-left">
                    <button 
                        className="chat-back-btn" 
                        onClick={onBack} 
                        aria-label="Go back"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="chat-avatar-ring">
                        <Avatar 
                            src={activeChat.avatar} 
                            alt="Avatar" 
                            size={38} 
                            frame={activeChat.avatarFrame || 'none'}
                        />
                    </div>
                    <div className="chat-header-info">
                        <span className="chat-header-status">
                            {typingUsers?.has(activeChat.username) ? (
                                <span className="text-gradient-bg" style={{ fontWeight: 800, fontSize: '0.7rem' }}>TYPING...</span>
                            ) : (
                                <span className="status-indicator-live">
                                    <span className="live-dot" /> Active now
                                </span>
                            )}
                        </span>
                    </div>
                </div>
                {!hideCallButtons && (
                    <div className="chat-header-right">
                        <button className="chat-icon-btn glow" onClick={() => onStartCall && onStartCall('audio')} aria-label="Audio Call">
                            <Phone size={20} />
                        </button>
                        <button className="chat-icon-btn glow" onClick={() => onStartCall && onStartCall('video')} aria-label="Video Call">
                            <Video size={20} />
                        </button>
                    </div>
                )}
            </div>

            <div className="chat-messages-container">
                <div className="chat-messages-v2">
                    {activeChat.messages.map((msg, index) => {
                        const isLastInGroup = index === activeChat.messages.length - 1 || activeChat.messages[index + 1].username !== msg.username;
                        return (
                            <div 
                                key={msg.id || index} 
                                className={`message-v2 ${msg.isMe ? 'me' : 'them'}`}
                                onContextMenu={(e) => { e.preventDefault(); setLongPressedMsg(msg); }}
                            >
                                <div className="message-content">
                                    {(() => {
                                        const isMedia = msg.type === 'gif' || msg.type === 'image' || (msg.text && (msg.text.includes('[LOCATION:') || msg.text.includes('giphy.com') || msg.text.includes('.gif')));
                                        return (
                                            <div className={isMedia ? 'message-media-content' : 'message-bubble-v2'}>
                                                {msg.text && msg.text.includes('[LOCATION:') ? (
                                            (() => {
                                                const match = msg.text.match(/\[LOCATION:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\]/);
                                                if (match) {
                                                    const lat = parseFloat(match[1]);
                                                    const lon = parseFloat(match[2]);
                                                    const margin = 0.01;
                                                    const bbox = [lon - margin, lat - margin, lon + margin, lat + margin].join('%2C');
                                                    
                                                    return (
                                                        <div className="vyx-map-placeholder-pre" onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank')}>
                                                            <div className="vyx-map-header"><span className="vyx-map-badge">VYX MAP ENGINE v3</span></div>
                                                            <div className="vyx-map-preview-static">
                                                                <iframe className="vyx-map-iframe" title="Vyx Location" src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`} loading="lazy" />
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return msg.text;
                                            })()
                                        ) : msg.type === 'gif' || (msg.text && (msg.text.includes('giphy.com') || msg.text.includes('.gif'))) ? (
                                            <div className="message-media-wrapper">
                                                {(() => {
                                                    if (!msg.text) return null;
                                                    const gifId = msg.text.split('/').pop().split('-').pop().replace(/\.gif$/i, '');
                                                    return <img src={`https://i.giphy.com/${gifId}.gif`} alt="Giphy" className="message-gif-media" />;
                                                })()}
                                            </div>
                                        ) : msg.type === 'image' ? (
                                            <img src={msg.text} alt="Shared Photo" className="message-image-media" />
                                        ) : (
                                            msg.text
                                        )}
                                            </div>
                                        );
                                    })()}
                                    
                                    {msg.reactions?.length > 0 && (
                                        <div className="message-reactions-pill glass-panel">
                                            {msg.reactions.map((r, i) => (
                                                <span key={i} title={r.username}>{r.emoji}</span>
                                            ))}
                                        </div>
                                    )}

                                    {isLastInGroup && (
                                        <div className="message-status-v2">
                                            {msg.isMe ? (
                                                <div className={`status-icon-wrapper ${msg.readStatus ? 'seen' : 'sent'}`}>
                                                    {msg.readStatus ? <CheckCheck size={14} className="status-icon seen" /> : <Check size={14} className="status-icon sent" />}
                                                </div>
                                            ) : (
                                                <span className="msg-time-stamp">{msg.time}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {longPressedMsg?.id === msg.id && (
                                    <div className="reaction-picker-v2 animate-pop-in">
                                        {['🔥', '❤️', '🙌', '💯', '😲', '😂'].map(emoji => (
                                            <button key={emoji} onClick={() => handleMessageVibe(msg.id, emoji)}>{emoji}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {typingUsers?.has(activeChat.username) && (
                        <div className="message-v2 them">
                            <div className="typing-indicator-v4">
                                <span />
                                <span />
                                <span />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {showStoryMode && createPortal(
                <div className="story-camera-overlay">
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div className="story-camera-header">
                        <div className="story-cam-logo">Vyx Cam</div>
                        <button className="story-close-btn" onClick={stopCamera}>Cancel</button>
                    </div>

                    <div className="story-camera-viewport">
                        {!previewImage ? (
                            <div className="video-feed-container">
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className="story-video-feed"
                                />
                                <div className="cam-corners">
                                    <div className="corner tl" /><div className="corner tr" />
                                    <div className="corner bl" /><div className="corner br" />
                                </div>
                                {isCameraLoading && <div className="cam-loading">Initializing Lens...</div>}
                            </div>
                        ) : (
                            <div className="story-preview-container">
                                <img src={previewImage} alt="Preview" className="story-preview-img" />
                                <div className="preview-branding">SHOT ON VYX</div>
                            </div>
                        )}
                    </div>

                    <div className="story-camera-footer">
                        {!previewImage ? (
                            <button 
                                className="capture-trigger-btn" 
                                onClick={capturePhoto}
                                disabled={isCameraLoading}
                            >
                                <div className="capture-inner" />
                            </button>
                        ) : (
                            <div className="preview-actions">
                                <button className="story-secondary-btn" onClick={() => setPreviewImage(null)}>Retake</button>
                                <button className="story-primary-btn" onClick={() => {
                                    onSendMessage(previewImage, 'image');
                                    stopCamera();
                                }}>Send to Chat</button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {showVoiceRecorder && createPortal(
                <>
                    <div className="action-sheet-backdrop" onClick={() => !isRecording && setShowVoiceRecorder(false)} />
                    <div className="voice-recorder-sheet animate-sheet-up">
                        <div className="action-sheet-handle" />
                        <div className="voice-recorder-content">
                            <div className="recorder-status">
                                {isRecording ? (
                                    <div className="status-live">
                                        <div className="record-dot" />
                                        <span>RECORDING</span>
                                    </div>
                                ) : (
                                    <span className="status-ready">READY TO RECORD</span>
                                )}
                            </div>
                            
                            <div className={`mic-visualization ${isRecording ? 'active' : ''}`}>
                                {isRecording ? (
                                    <div className="waveform-container">
                                        {Array.from(audioData).map((val, i) => (
                                            <div 
                                                key={i} 
                                                className="waveform-bar" 
                                                style={{ height: `${(val / 255) * 100}%` }} 
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <div className="pulse-ring" />
                                        <div className="pulse-ring delay-1" />
                                        <div className="pulse-ring delay-2" />
                                    </>
                                )}
                                <div className="mic-circle">
                                    <Mic size={40} color={isRecording ? "#ff4757" : "#fff"} />
                                </div>
                            </div>

                            <div className="record-timer">{formatTime(recordTime)}</div>

                            <div className="recorder-actions">
                                {!isRecording ? (
                                    <>
                                        <button className="recorder-secondary-btn" onClick={() => setShowVoiceRecorder(false)}>Cancel</button>
                                        <button className="recorder-primary-btn" onClick={startRecording}>Start Recording</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="recorder-secondary-btn danger" onClick={() => stopRecording(false)}>Discard</button>
                                        <button className="recorder-primary-btn" onClick={() => stopRecording(true)}>Stop & Send</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {showGifs && createPortal(
                <>
                    <div className="action-sheet-backdrop" onClick={() => { setShowGifs(false); setIsGifMode(false); }} />
                    <div className="action-sheet-container animate-sheet-up" onClick={(e) => e.stopPropagation()}>
                        <div className="action-sheet-handle" />
                        
                        {isGifMode ? (
                            <div className="gif-picker-content">
                                <div className="gif-picker-header">
                                    <button className="gif-back-btn" onClick={() => { setShowGifs(false); setIsGifMode(false); }}>
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="gif-search-box">
                                        <Search size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Search GIPHY..." 
                                            value={gifSearch}
                                            onChange={(e) => {
                                                setGifSearch(e.target.value);
                                                if (e.target.value) setSelectedCategory('Search');
                                            }}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="gif-categories-bar premium-scroll">
                                    {[
                                        { id: 'Trending', icon: '🔥', label: 'Trending' },
                                        { id: 'Reactions', icon: '🎭', label: 'Reactions' },
                                        { id: 'Love', icon: '💖', label: 'Love' },
                                        { id: 'Happy', icon: '😊', label: 'Happy' },
                                        { id: 'Sad', icon: '😢', label: 'Sad' },
                                        { id: 'Dance', icon: '💃', label: 'Dance' },
                                        { id: 'Angry', icon: '💢', label: 'Angry' },
                                        { id: 'Wow', icon: '😮', label: 'Wow' },
                                        { id: 'Music', icon: '🎵', label: 'Music' },
                                        { id: 'Memes', icon: '🤡', label: 'Memes' }
                                    ].map(cat => (
                                        <button 
                                            key={cat.id} 
                                            className={`gif-category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedCategory(cat.id);
                                                setGifSearch('');
                                            }}
                                        >
                                            <span className="cat-icon">{cat.icon}</span> {cat.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="gif-results-header">
                                    <span className="global-trending-badge">
                                        {gifSearch ? `SEARCH: ${gifSearch.toUpperCase()}` : selectedCategory.toUpperCase()}
                                    </span>
                                </div>

                                <div className="gif-results-grid">
                                    {isLoadingGifs ? (
                                        <div className="gif-loading-state">
                                            <div className="gif-pulse-loader" />
                                            <span>Browsing Giphy...</span>
                                        </div>
                                    ) : gifs.length > 0 ? (
                                        gifs.map((gif) => (
                                            <div 
                                                key={gif.id} 
                                                className="gif-picker-item-wrapper"
                                                onClick={() => {
                                                    const directUrl = `https://i.giphy.com/${gif.id}.gif`;
                                                    onSendMessage(directUrl, 'gif'); 
                                                    setShowGifs(false); 
                                                    setIsGifMode(false);
                                                }}
                                            >
                                                <img 
                                                    src={`https://i.giphy.com/${gif.id}.gif`}
                                                    alt={gif.title}
                                                    className="gif-item-preview"
                                                    onLoad={(e) => e.target.classList.add('loaded')}
                                                />
                                                <div className="gif-click-overlay" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="gif-empty-state">No GIFs found for this search.</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="action-sheet-grid">
                                {[
                                    { id: 'action-gif', label: 'GIFs', icon: <SmileIcon size={20} />, color: 'rgba(168, 85, 247, 0.2)', textColor: '#00f2ff', action: () => { setIsGifMode(true); } },
                                    { id: 'action-gallery', label: 'Gallery', icon: <ImageIcon size={20} />, color: 'rgba(16, 185, 129, 0.2)', textColor: '#10b981', action: () => { handleGalleryClick(); } },
                                    { id: 'action-camera', label: 'Camera', icon: <Camera size={20} />, color: 'rgba(59, 130, 246, 0.2)', textColor: '#3b82f6', action: () => { handleCameraClick(); } },
                                    { id: 'action-tip', label: 'Send Tip', icon: <Zap size={20} />, color: 'rgba(245, 158, 11, 0.2)', textColor: '#f59e0b', action: () => { onSendMessage(`⚡ Sent a Vibe Tip of 50 Tokens`, 'text'); setShowGifs(false); } },
                                    { id: 'action-location', label: 'Location', icon: <Plus size={20} />, color: 'rgba(249, 115, 22, 0.2)', textColor: '#f97316', action: () => { handleLocationClick(); } }
                                ].map((item) => (
                                    <div key={item.id} className="action-sheet-item" onClick={(e) => { 
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (item.id !== 'action-gif') setShowGifs(false); 
                                        item.action(); 
                                    }}>
                                        <div className="action-sheet-icon-box" style={{ background: item.color, color: item.textColor }}>
                                            {item.icon}
                                        </div>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}

            {(() => {
                const inputContent = isDisabled ? (
                    <div className="gating-nexus-bar animate-sheet-up">
                        <div className="nexus-stats">
                            <div className="nexus-stat">
                                <Users size={14} />
                                <span>{communityStats?.memberCount?.toLocaleString() || '0'} Vyxrs</span>
                            </div>
                            <div className="nexus-stat">
                                <Gavel size={14} />
                                <span>{communityStats?.activeProposals || '0'} Active Shifts</span>
                            </div>
                        </div>
                        <div className="nexus-action">
                             Join community to chat
                        </div>
                    </div>
                ) : (
                    <div className="chat-input-wrapper-premium">
                        <div className="chat-input-prefix">
                            <button className="chat-camera-btn" onClick={handleCameraClick} aria-label="Camera">
                                <Camera size={20} color="#fff" strokeWidth={2.5} />
                            </button>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Message..." 
                            className="chat-input-field" 
                            value={msgText}
                            onChange={handleInputChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                            disabled={isDisabled}
                        />
                        <div className="chat-input-suffix">
                            {msgText.trim() ? (
                                <button className="chat-send-btn" onClick={handleSendText}>Send</button>
                            ) : (
                                <div className="chat-input-actions-group">
                                    <button className="chat-action-sm-btn" onClick={handleMicClick} aria-label="Microphone"><Mic size={20} /></button>
                                    <button className="chat-action-sm-btn" onClick={handlePlusClick} aria-label="More options"><Plus size={20} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                );

                // Portal to document.body on mobile to bypass any parent transforms/layout constraints
                if (window.innerWidth <= 768) {
                    return createPortal(
                        <div className="chat-input-bar-glass mobile-portal">
                            {inputContent}
                        </div>,
                        document.body
                    );
                }

                return (
                    <div className="chat-input-bar-glass">
                        {inputContent}
                    </div>
                );
            })()}
        </div>
    );
};

export default ChatWindow;
