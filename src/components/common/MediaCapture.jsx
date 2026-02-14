import { useState, useRef, useEffect } from 'react';
import { Camera, Image, X, RefreshCw, Zap, ZapOff, Play, Send } from 'lucide-react';
import './MediaCapture.css';

const MediaCapture = ({ onCapture, onClose, type = 'all' }) => {
    const [mode, setMode] = useState('choice'); // 'choice', 'camera', 'preview'
    const [stream, setStream] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (mode === 'camera' && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [mode, stream]);

    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [stream]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } },
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
        ctx.drawImage(video, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreviewUrl(dataUrl);
        setMediaType('image');
        setMode('preview');

        if (stream) stream.getTracks().forEach(track => track.stop());
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
        console.log("[MediaCapture] handleConfirm triggered", { mediaType, hasPreview: !!previewUrl });
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
                    <div className="camera-controls">
                        <button className="ctrl-btn" onClick={() => setIsFlashOn(!isFlashOn)}>
                            {isFlashOn ? <Zap size={24} /> : <ZapOff size={24} />}
                        </button>
                        <button className="shutter-btn" onClick={takePhoto}>
                            <div className="shutter-inner" />
                        </button>
                        <button className="ctrl-btn" onClick={() => setMode('choice')}>
                            <RefreshCw size={24} />
                        </button>
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
