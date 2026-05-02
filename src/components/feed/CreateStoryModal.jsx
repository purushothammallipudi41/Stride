import React, { useRef, useState, useEffect } from 'react';
import { X, Send, Camera, Music, Image as ImageIcon, Type, BarChart2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../utils/api';
import socket from '../../services/socket';
import './CreateStoryModal.css';

const CreateStoryModal = ({ isOpen, onClose, onConfirm, isUploading, isSuccess, error }) => {
    const navigate = useNavigate();
    const [previewImage, setPreviewImage] = useState(null);
    const [textMode, setTextMode] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [pollData, setPollData] = useState(null); // { question, option1, option2 }
    const [stream, setStream] = useState(null);
    const [overlayText, setOverlayText] = useState('');
    const [isTextFocused, setIsTextFocused] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [isConfirmingLive, setIsConfirmingLive] = useState(false);

    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (isCameraActive && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [isCameraActive, stream]);

    if (!isOpen) return null;

    // Mock tracks from data.json context
    const mockTracks = [
        { id: 's1', title: 'Start Again', artist: 'Alex Stride', cover: '' },
        { id: 's2', title: 'City Lights', artist: 'Alex Stride', cover: '' },
        { id: 's4', title: 'Voltage', artist: 'Marcus Vibe', cover: '' },
        { id: 's3', title: 'Midnight Horizons', artist: 'Alex Stride', cover: '' }

    ];

    const startCamera = async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } } 
            });
            setStream(newStream);
            setIsCameraActive(true);
            setTextMode(false);
            setPreviewImage(null);
        } catch (err) {
            console.error("Camera access error:", err);
            cameraInputRef.current.click();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraActive(false);
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            setPreviewImage(dataUrl);
            stopCamera();
        }
    };

    const handleClose = () => {
        stopCamera();
        onClose();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setTextMode(false);
                setIsCameraActive(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryClick = () => {
        stopCamera();
        galleryInputRef.current.click();
    };

    const handleCameraClick = () => {
        if (isCameraActive) {
            takePhoto();
            if (navigator.vibrate) navigator.vibrate(15);
        } else {
            startCamera();
        }
    };

    const handleTextMode = () => {
        setIsMusicPickerOpen(false);
        if (previewImage) {
            setIsTextFocused(true);
        } else {
            setTextMode(!textMode);
            setPreviewImage(null);
        }
    };

    const handleMusicPicker = () => {
        setIsMusicPickerOpen(true);
        stopCamera();
    };

    const selectTrack = (track) => {
        setSelectedTrack(track);
        setIsMusicPickerOpen(false);
    };

    const handleAddPoll = () => {
        setPollData({
            question: "Vibe Check?",
            option1: "🔥 On Fire",
            option2: "❄️ Chill"
        });
    };

    const updatePoll = (field, value) => {
        setPollData(prev => ({ ...prev, [field]: value }));
    };

    const handleShare = () => {
        if (navigator.vibrate) navigator.vibrate(20);
        
        if (isLive) {
            setIsConfirmingLive(true);
        } else {
            // Handle regular story upload
            onConfirm(previewImage, { track: selectedTrack, poll: pollData, overlayText });
        }
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleFinalLiveStart = async () => {
        stopCamera();
        onClose();
        
        try {
            // Standardize Socket Signal name
            socket.emit('live_pulse_updated', { 
                username: user.username, 
                isLive: true,
                avatar: user.avatar 
            });
            
            // Standardize API endpoint to /studio/live/start
            await fetch(`${BASE_URL}/api/studio/live/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username })
            });
        } catch (err) {
            console.warn("Live start API failed:", err);
        }

        navigate(`/live/${user.username}`);
    };

    return (
        <div className="modal-overlay story-modal-overlay animate-fade-in" onClick={onClose}>
            <div className={`story-create-full glass-panel ${error ? 'animate-shake' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="story-top-actions">
                    <button className="icon-btn-round" onClick={handleClose}><X size={24} /></button>
                    <div className="top-tools">
                        <button 
                            className="icon-btn-round" 
                            onClick={handleMusicPicker}
                            style={{ color: selectedTrack ? 'var(--theme-accent)' : 'white' }}
                        >
                            <Music size={20} />
                        </button>
                        <button 
                            className="icon-btn-round" 
                            onClick={handleAddPoll}
                            style={{ color: pollData ? 'var(--theme-accent)' : 'white' }}
                        >
                            <BarChart2 size={20} />
                        </button>
                        <button className="icon-btn-round" onClick={handleTextMode} style={{ color: textMode || overlayText ? 'var(--theme-accent)' : 'white' }}><Type size={20} /></button>
                    </div>
                </div>

                <div className={`story-preview-main ${textMode ? 'text-mode-bg' : ''} ${isCameraActive ? 'camera-active' : ''}`}>
                    <div className="preview-user-info">
                        <img src={user.avatar} alt="User" className="mini-avatar" />
                        <span className="username">Your Story</span>
                    </div>
                    
                    {isCameraActive && (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="webcam-preview"
                        />
                    )}
                    
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    <div className="story-overlay-layers">
                        {previewImage && (
                            <img 
                                src={previewImage} 
                                alt="Story Preview" 
                                className="full-preview-img animate-scale-in"
                                onError={() => setPreviewImage(null)}
                            />
                        )}
                        
                        {overlayText && !isTextFocused && (
                            <div className="text-sticker-display animate-pop-in" onClick={() => setIsTextFocused(true)}>
                                {overlayText}
                            </div>
                        )}

                        {isTextFocused && (
                            <div className="text-sticker-overlay animate-scale-in">
                                <textarea
                                    autoFocus
                                    className="story-overlay-input"
                                    placeholder="Type something..."
                                    value={overlayText}
                                    onChange={(e) => setOverlayText(e.target.value)}
                                    onBlur={() => {
                                        setIsTextFocused(false);
                                    }}
                                />
                            </div>
                        )}

                        {selectedTrack && (
                            <div className="sticker-item music-sticker animate-scale-in">
                                <img src={selectedTrack.cover} alt="Cover" className="sticker-cover" />
                                <div className="sticker-info">
                                    <span className="sticker-title">{selectedTrack.title}</span>
                                    <span className="sticker-artist">{selectedTrack.artist}</span>
                                </div>
                                <button className="remove-sticker" onClick={() => setSelectedTrack(null)}><X size={14} /></button>
                            </div>
                        )}

                        {pollData && (
                            <div className="sticker-item poll-sticker animate-scale-in glass-panel">
                                <input 
                                    className="poll-question-input"
                                    value={pollData.question}
                                    onChange={(e) => updatePoll('question', e.target.value)}
                                    placeholder="Ask a question..."
                                />
                                <div className="poll-options">
                                    <input 
                                        className="poll-option-input"
                                        value={pollData.option1}
                                        onChange={(e) => updatePoll('option1', e.target.value)}
                                    />
                                    <input 
                                        className="poll-option-input"
                                        value={pollData.option2}
                                        onChange={(e) => updatePoll('option2', e.target.value)}
                                    />
                                </div>
                                <button className="remove-sticker" onClick={() => setPollData(null)}><X size={14} /></button>
                            </div>
                        )}
                    </div>

                    {!previewImage && !isCameraActive && (
                        <div className="empty-preview-placeholder">
                            {textMode ? (
                                <textarea 
                                    className="story-text-input" 
                                    placeholder="Type something..." 
                                    autoFocus 
                                    value={overlayText}
                                    onChange={(e) => setOverlayText(e.target.value)}
                                />
                            ) : (
                                <div className="placeholder-content">
                                    <ImageIcon size={48} className="opacity-20" />
                                    <p>Select a photo to start</p>
                                </div>
                            )}
                        </div>
                    )}

                    {isUploading && (
                        <div className="syncing-overlay animate-fade-in">
                            <div className="syncing-content">
                                <Music className="animate-pulse" size={40} />
                                <p>Syncing Story to Cloud...</p>
                            </div>
                        </div>
                    )}

                    {isSuccess && (
                        <div className="success-overlay animate-fade-in">
                            <div className="success-content">
                                <div className="check-icon">✓</div>
                                <p>Story Synced! 🚀</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-message-floating animate-shake">
                            {error}
                        </div>
                    )}
                </div>

                <div className="story-bottom-actions">
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={galleryInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange} 
                    />
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        ref={cameraInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange} 
                    />
                    <div className="story-options-pills">
                        <button className={`pill-btn ${isCameraActive ? 'active-camera-pill' : ''}`} onClick={handleCameraClick}>
                            <Camera size={18} />
                            <span>{isCameraActive ? 'Capture' : 'Camera'}</span>
                        </button>
                        <button className="pill-btn" onClick={handleGalleryClick}><ImageIcon size={18} /><span>Gallery</span></button>
                        <button 
                            className={`pill-btn live-toggle-btn ${isLive ? 'is-live-active' : ''}`} 
                            onClick={() => setIsLive(!isLive)}
                        >
                            <div className={`live-dot ${isLive ? 'pulse-fast' : ''}`} />
                            <span>Go Live</span>
                        </button>
                    </div>
                    <button 
                        className={`instagram-share-btn text-gradient-bg ${isLive ? 'is-live-action' : ''}`} 
                        onClick={handleShare}
                        disabled={isUploading || (!previewImage && !textMode && !overlayText && !isLive)}
                    >
                        {isUploading ? "Sharing..." : isLive ? "Start Broadcast" : "Share to Story"}
                        {isLive ? <Play size={18} fill="white" /> : <Send size={18} />}
                    </button>
                </div>

                {isConfirmingLive && (
                    <div className="live-confirmation-overlay animate-fade-in">
                        <div className="live-confirm-card glass-panel animate-pop-in">
                            <div className="live-confirm-icon">
                                <Play size={40} fill="var(--theme-accent)" color="var(--theme-accent)" />
                                <div className="pulse-ring" />
                            </div>
                            <h3>Ready to Go Live?</h3>
                            <p>You're about to start your broadcast and notify your followers.</p>
                            
                            <div className="confirm-actions">
                                <button className="confirm-start-btn" onClick={handleFinalLiveStart}>
                                    Confirm & Start
                                </button>
                                <button className="confirm-cancel-btn" onClick={() => setIsConfirmingLive(false)}>
                                    Not Yet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isMusicPickerOpen && (
                    <div className="music-picker-overlay animate-slide-up">
                        <div className="music-picker-header">
                            <h3>Choose Music</h3>
                            <button className="close-picker" onClick={() => setIsMusicPickerOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="tracks-list">
                            {mockTracks.map(track => (
                                <div key={track.id} className="track-item" onClick={() => selectTrack(track)}>
                                    <img src={track.cover} alt="Cover" />
                                    <div className="track-details">
                                        <div className="track-name">{track.title}</div>
                                        <div className="artist-name">{track.artist}</div>
                                    </div>
                                    <Music size={16} className="opacity-40" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateStoryModal;
