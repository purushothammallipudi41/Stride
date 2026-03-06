import { useState, useRef, useEffect } from 'react';
import { Camera, Image, X, RefreshCw, Zap, ZapOff, Play, Send, Sparkles } from 'lucide-react';
import { AR_FILTERS } from '../../constants/ARFilters';
import { arManager } from '../../utils/ARManager';
import './MediaCapture.css';

const MediaCapture = ({ onCapture, onClose, type = 'all' }) => {
    const [mode, setMode] = useState('choice'); // 'choice', 'camera', 'preview'
    const [stream, setStream] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [facingMode, setFacingMode] = useState('user');
    const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'
    const [activeFilter, setActiveFilter] = useState(AR_FILTERS[0]);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const requestRef = useRef();

    useEffect(() => {
        if (mode === 'camera' && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [mode, stream]);

    useEffect(() => {
        if (mode === 'camera') {
            arManager.init().then(() => {
                requestRef.current = requestAnimationFrame(renderLoop);
            });
        }
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            cancelAnimationFrame(requestRef.current);
        };
    }, [mode, stream]);

    const renderLoop = (time) => {
        if (mode === 'camera' && videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (video.readyState >= 2) {
                // Match sizes
                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Process frame via MediaPipe
                const results = arManager.processFrame(video, time);

                if (results && activeFilter.id !== 'none') {
                    arManager.drawEffect(ctx, results, activeFilter, canvas.width, canvas.height);
                }
            }
        }
        requestRef.current = requestAnimationFrame(renderLoop);
    };

    const startCamera = async (currentFacing = facingMode) => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: currentFacing, width: { ideal: 1080 }, height: { ideal: 1920 } },
                audio: false
            });
            setStream(mediaStream);
            setMode('camera');
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Camera access denied. Please check permissions.");
        }
    };

    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        // Draw the video frame
        ctx.drawImage(video, 0, 0);

        // Overlay the AR effect if present
        if (activeFilter.id !== 'none') {
            // We can reuse arManager's logic or a temporary capture
            const results = arManager.results;
            arManager.drawEffect(ctx, results, activeFilter, canvas.width, canvas.height);
        }

        const dataUrl = canvas.toDataURL('image/webp', 1.0);
        setPreviewUrl(dataUrl);
        setMediaType('image');
        setMode('preview');

        if (stream) stream.getTracks().forEach(track => track.stop());
        cancelAnimationFrame(requestRef.current);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setMediaType(file.type.startsWith('video') ? 'video' : 'image');
        setMode('preview');
    };

    const handleConfirm = () => {
        onCapture(previewUrl, mediaType);
    };

    const handleCancel = () => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setMode('choice');
    };

    return (
        <div className="media-capture-container">
            {mode === 'choice' && (
                <div className="capture-choice animate-in">
                    <button className="choice-btn camera" onClick={startCamera}>
                        <div className="icon-wrap"><Camera size={32} /></div>
                        <span>Take Photo</span>
                    </button>
                    <button className="choice-btn gallery" onClick={() => fileInputRef.current.click()}>
                        <div className="icon-wrap"><Image size={32} /></div>
                        <span>Upload from Device</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept={type === 'all' ? 'image/*,video/*' : type === 'image' ? 'image/*' : 'video/*'}
                        onChange={handleFileUpload}
                    />
                </div>
            )}

            {mode === 'camera' && (
                <div className="camera-view animate-in">
                    <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
                    <canvas ref={canvasRef} className="ar-overlay-canvas" />

                    <div className="camera-controls">
                        <div className="filter-carousel">
                            {AR_FILTERS.map(filter => (
                                <div
                                    key={filter.id}
                                    className={`filter-item ${activeFilter?.id === filter.id ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(filter)}
                                >
                                    <div className="filter-icon">{filter.icon}</div>
                                    <span>{filter.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="camera-actions-row">
                            <button className="ctrl-btn" onClick={() => setIsFlashOn(!isFlashOn)}>
                                {isFlashOn ? <Zap size={22} fill="white" /> : <ZapOff size={22} />}
                            </button>

                            <button className="shutter-btn" onClick={takePhoto}>
                                <div className="shutter-inner" />
                            </button>

                            <button className="ctrl-btn" onClick={() => {
                                const newMode = facingMode === 'user' ? 'environment' : 'user';
                                setFacingMode(newMode);
                                startCamera(newMode);
                            }}>
                                <RefreshCw size={22} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'preview' && (
                <div className="media-preview animate-in">
                    {mediaType === 'video' ? (
                        <video src={previewUrl} autoPlay loop muted playsInline className="preview-content" />
                    ) : (
                        <img src={previewUrl} alt="Preview" className="preview-content" />
                    )}
                    <div className="preview-actions">
                        <button className="preview-btn secondary" onClick={handleCancel}>
                            <RefreshCw size={24} />
                        </button>
                        <button className="preview-btn primary" onClick={handleConfirm}>
                            <Send size={24} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaCapture;
