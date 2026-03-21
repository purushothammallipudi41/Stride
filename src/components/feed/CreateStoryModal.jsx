import React, { useRef, useState } from 'react';
import { X, Send, Camera, Music, Image as ImageIcon, Type } from 'lucide-react';
import './CreateStoryModal.css';

const CreateStoryModal = ({ isOpen, onClose, onConfirm, isUploading }) => {
    const [previewImage, setPreviewImage] = useState(null);
    const [textMode, setTextMode] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [stream, setStream] = useState(null);
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    if (!isOpen) return null;

    const startCamera = async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } } 
            });
            setStream(newStream);
            setIsCameraActive(true);
            setTextMode(false);
            setPreviewImage(null);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            // Fallback to file input if webcam fails
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
        } else {
            startCamera();
        }
    };

    const handleTextMode = () => {
        setTextMode(!textMode);
        if (!textMode) setPreviewImage(null);
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="modal-overlay story-modal-overlay animate-fade-in" onClick={onClose}>
            <div className="story-create-full glass-panel" onClick={e => e.stopPropagation()}>
                <div className="story-top-actions">
                    <button className="icon-btn-round" onClick={handleClose}><X size={24} /></button>
                    <div className="top-tools">
                        <button className="icon-btn-round" onClick={() => alert('Music feature coming soon!')}><Music size={20} /></button>
                        <button className="icon-btn-round" onClick={handleTextMode} style={{ color: textMode ? 'var(--theme-accent)' : 'white' }}><Type size={20} /></button>
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

                    {previewImage ? (
                        <img 
                            src={previewImage} 
                            alt="Story Preview" 
                            className="full-preview-img animate-scale-in"
                        />
                    ) : (
                        !isCameraActive && (
                            <div className="empty-preview-placeholder">
                                {textMode ? (
                                    <textarea className="story-text-input" placeholder="Type something..." autoFocus />
                                ) : (
                                    <div className="placeholder-content">
                                        <ImageIcon size={48} className="opacity-20" />
                                        <p>Select a photo to start</p>
                                    </div>
                                )}
                            </div>
                        )
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
                    </div>
                    <button 
                        className="instagram-share-btn text-gradient-bg" 
                        onClick={() => onConfirm(previewImage)}
                        disabled={isUploading || (!previewImage && !textMode)}
                    >
                        {isUploading ? "Sharing..." : "Share to Story"}
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateStoryModal;
