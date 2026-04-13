import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Video, Image as ImageIcon, ChevronLeft, Mic, Plus, Smile as SmileIcon, Camera, MessageSquare, Search } from 'lucide-react';
import socket from '../../services/socket';
import Avatar from '../common/Avatar';
import VerificationBadge from '../common/VerificationBadge';
import './Chat.css';

const ChatWindow = ({ activeChat, onSendMessage, onStartCall, roomId, currentUser, onBack, isDisabled, hideCallButtons, typingUsers }) => {
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
    const [showStoryMode, setShowStoryMode] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

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
    };

    const handleSendText = () => {
        if (msgText.trim()) {
            onSendMessage(msgText, 'text');
            setMsgText('');
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
            const dataUrl = canvas.toDataURL('image/jpeg');
            setPreviewImage(dataUrl);
            console.log('SocialAction: Photo captured');
        }
    };

    const handleLocationClick = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            // Send the special token format that the Stride Map Engine expects
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
            onSendMessage(`Sent a photo: ${file.name}`, 'image');
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
        console.log('SocialAction: Mic clicked - Opening recorder');
        setShowVoiceRecorder(true);
    };

    const startRecording = () => {
        setIsRecording(true);
        console.log('SocialAction: Recording started');
    };

    const stopRecording = (shouldSend = true) => {
        setIsRecording(false);
        if (shouldSend && recordTime > 0) {
            onSendMessage(`🎤 Voice Message (${formatTime(recordTime)})`, 'text');
        }
        setShowVoiceRecorder(false);
        console.log(`SocialAction: Recording stopped. Sent: ${shouldSend}`);
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
                    <button className="chat-tab active" style={{ marginTop: '20px', padding: '12px 30px' }}>
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
                        <div className="chat-header-name-row">
                            <span className="chat-header-name">{activeChat.name || activeChat.username}</span>
                            {activeChat.isVerified && <VerificationBadge size={14} />}
                        </div>
                        <span className="chat-header-status">{typingUsers?.has(activeChat.username) ? <span className="text-gradient">typing...</span> : 'Active now'}</span>
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
                            <div key={msg.id || index} className={`message-v2 ${msg.isMe ? 'me' : 'them'}`}>
                                <div className="message-content">
                                    {(() => {
                                        const isMedia = msg.type === 'gif' || msg.type === 'image' || (msg.text && (msg.text.includes('[LOCATION:') || msg.text.includes('giphy.com') || msg.text.includes('.gif')));
                                        return (
                                            <div className={isMedia ? 'message-media-content' : 'message-bubble-v2'}>
                                                {msg.text && msg.text.includes('[LOCATION:') ? (
                                            (() => {
                                                // Robust regex for coordinates (handles decimals and integers)
                                                const match = msg.text.match(/\[LOCATION:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\]/);
                                                if (match) {
                                                    const lat = parseFloat(match[1]);
                                                    const lon = parseFloat(match[2]);
                                                    // Calculate a significantly wider bbox for better framing (0.01 degree)
                                                    const margin = 0.01;
                                                    const bbox = [lon - margin, lat - margin, lon + margin, lat + margin].join('%2C');
                                                    
                                                    return (
                                                        <div className="stride-map-placeholder-pre" onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank')}>
                                                            <div className="stride-map-header">
                                                                <span className="stride-map-badge">STRIDE MAP ENGINE v3</span>
                                                            </div>
                                                            <div className="stride-map-preview-static">
                                                                <iframe 
                                                                    className="stride-map-iframe"
                                                                    title="Stride Location"
                                                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`}
                                                                    onLoad={(e) => console.log('SocialAction: Map fully loaded')}
                                                                    loading="lazy"
                                                                />
                                                                <div className="media-loading-overlay">Loading Map...</div>
                                                            </div>
                                                            <div className="stride-map-footer">
                                                                Shared Location
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
                                                    const rawId = msg.text.split('/').pop().split('-').pop();
                                                    const gifId = rawId.replace(/\.gif$/i, '');
                                                    return (
                                                        <img 
                                                            src={`https://i.giphy.com/${gifId}.gif`}
                                                            alt="Giphy" 
                                                            className="message-gif-media loaded" 
                                                            onLoad={(e) => e.target.parentNode.classList.add('loaded')}
                                                        />
                                                    );
                                                })()}
                                                <div className="media-loading-overlay">Loading GIF...</div>
                                            </div>
                                        ) : msg.type === 'image' ? (
                                            <img src={msg.text} alt="Shared Photo" className="message-image-media" />
                                        ) : (
                                            msg.text
                                        )}
                                            </div>
                                        );
                                    })()}
                                    {isLastInGroup && (
                                        <div className="message-status-v2">
                                            {msg.isMe ? (msg.readStatus ? 'Seen' : 'Sent') : msg.time}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {showStoryMode && createPortal(
                <div className="story-camera-overlay">
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div className="story-camera-header">
                        <div className="story-cam-logo">Stride Cam</div>
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
                                <div className="preview-branding">SHOT ON STRIDE</div>
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
                                <div className="pulse-ring" />
                                <div className="pulse-ring delay-1" />
                                <div className="pulse-ring delay-2" />
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
                                    { id: 'action-gif', label: 'GIFs', icon: <SmileIcon size={20} />, color: 'rgba(168, 85, 247, 0.2)', textColor: '#a855f7', action: () => { console.log('SocialAction: GIF clicked'); setIsGifMode(true); } },
                                    { id: 'action-gallery', label: 'Gallery', icon: <ImageIcon size={20} />, color: 'rgba(16, 185, 129, 0.2)', textColor: '#10b981', action: () => { console.log('SocialAction: Gallery clicked'); handleGalleryClick(); } },
                                    { id: 'action-camera', label: 'Camera', icon: <Camera size={20} />, color: 'rgba(59, 130, 246, 0.2)', textColor: '#3b82f6', action: () => { console.log('SocialAction: Camera clicked'); handleCameraClick(); } },
                                    { id: 'action-location', label: 'Location', icon: <Plus size={20} />, color: 'rgba(249, 115, 22, 0.2)', textColor: '#f97316', action: () => { console.log('SocialAction: Location clicked'); handleLocationClick(); } }
                                ].map((item) => (
                                    <div key={item.id} className="action-sheet-item" onClick={(e) => { 
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log(`SocialAction: Click captured for ${item.id}`);
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

            <div className="chat-input-bar-glass">
                <div className="chat-input-wrapper-premium">
                    <div className="chat-input-prefix">
                        <button className="chat-camera-btn" onClick={handleCameraClick} aria-label="Camera">
                            <Camera size={20} color="#fff" strokeWidth={2.5} />
                        </button>
                    </div>
                    <input 
                        type="text" 
                        placeholder={isDisabled ? "Join community to chat" : "Message..."} 
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
            </div>
        </div>
    );
};

export default ChatWindow;
