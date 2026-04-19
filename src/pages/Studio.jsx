import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, RefreshCcw, Download, Tv, Zap, Users, Sparkles } from 'lucide-react';
import AIMuse from '../components/studio/AIMuse';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import './Studio.css';

const FILTERS = [
    { id: 'normal', name: 'Normal', css: 'none' },
    { id: 'cyberpunk', name: 'Cyberpunk', css: 'hue-rotate(180deg) saturate(150%) contrast(120%)' },
    { id: 'vaporwave', name: 'Vaporwave', css: 'hue-rotate(280deg) saturate(180%)' },
    { id: 'golden', name: 'Golden Hour', css: 'saturate(120%) sepia(20%) brightness(110%)' },
    { id: 'noir', name: 'Noir', css: 'grayscale(100%) contrast(150%) brightness(80%)' },
    { id: 'acid', name: 'Acid', css: 'saturate(500%) hue-rotate(45deg) contrast(150%)' },
    { id: 'vintage', name: 'Vintage', css: 'sepia(50%) contrast(90%) brightness(110%) hue-rotate(-20deg)' },
];

const Studio = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    
    const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
    const [studioMode, setStudioMode] = useState('reel'); // 'reel' or 'stage'
    const [isRecording, setIsRecording] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [recordTime, setRecordTime] = useState(0);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [showMuse, setShowMuse] = useState(false);
    const user = getStoredUser();

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            });
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to actually start playing before drawing
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setIsCameraReady(true);
                    drawToCanvas();
                };
            }
        } catch (err) {
            console.error("Studio Camera Access Error:", err);
            alert("Camera access denied or device not found.");
            navigate('/');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    const drawToCanvas = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Match canvas internal resolution to video source purely
        if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        // Apply hardware-accelerated aesthetic filter
        ctx.filter = activeFilter.css;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        animationRef.current = requestAnimationFrame(drawToCanvas);
    };

    // Keep the canvas loop updated if the filter changes
    useEffect(() => {
        if (isCameraReady) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            drawToCanvas();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilter, isCameraReady]);

    const handleAction = () => {
        if (studioMode === 'stage') {
            handleGoLive();
        } else {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        }
    };

    const handleGoLive = async () => {
        if (isLive) {
            // Stop Live
            try {
                await fetch(`${BASE_URL}/api/studio/live/stop`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user.username })
                });
                setIsLive(false);
                setViewerCount(0);
            } catch (err) {
                console.error("Failed to stop live:", err);
            }
        } else {
            // Start Live
            try {
                const res = await fetch(`${BASE_URL}/api/studio/live/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user.username })
                });
                const data = await res.json();
                if (data.success) {
                    setIsLive(true);
                    setViewerCount(Math.floor(Math.random() * 20)); // Mock initial viewers
                }
            } catch (err) {
                console.error("Failed to start live:", err);
                alert("Stage connection failed.");
            }
        }
    };

    const startRecording = () => {
        setRecordedChunks([]);
        
        // Capture MediaStream directly from Canvas at 30FPS for the visual filters
        const canvasStream = canvasRef.current.captureStream(30);
        
        // Merge Audio from the original getUserMedia stream so we have sound
        const audioTracks = streamRef.current.getAudioTracks();
        if (audioTracks.length > 0) {
            canvasStream.addTrack(audioTracks[0]);
        }

        const options = { mimeType: 'video/webm; codecs=vp9' };
        try {
            const recorder = new MediaRecorder(canvasStream, options);
            
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) setRecordedChunks(prev => [...prev, e.data]);
            };
            
            recorder.onstop = exportVideo;
            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
            
            // Auto-stop after 15 seconds max (Instagram Story rhythm)
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                    stopRecording();
                }
            }, 15000);
            
        } catch (e) {
            console.error("MediaRecorder Exception:", e);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordTime(0);
        }
    };

    const exportVideo = () => {
        // In a real Stride app, you would upload this blob to Firebase Storage.
        // For local Studio testing, we emulate a browser download.
        if (recordedChunks.length) {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `stride_studio_${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            alert("Studio Vibe Exported Successfully!");
        }
    };

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => setRecordTime(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    return (
        <div className="studio-container animate-fade-in">
            {/* Hidden Source Video */}
            <video ref={videoRef} playsInline muted style={{ display: 'none' }} />

            <div className="studio-header">
                <button className="studio-close-btn" onClick={() => navigate('/')}>
                    <X size={24} />
                </button>
                <h1 className="studio-title">
                    {studioMode === 'stage' ? <Tv size={24} /> : <Camera size={24} />} 
                    {studioMode === 'stage' ? 'VibeCast Stage' : 'Stride Studio'} 
                    {isRecording && <span className="studio-live-badge">REC</span>}
                    {isLive && <span className="stage-live-badge pulse">ON AIR</span>}
                </h1>
                <button className="studio-icon-btn glow" onClick={() => setShowMuse(!showMuse)}>
                    <Sparkles size={20} color={showMuse ? "#a855f7" : "#fff"} />
                </button>
                <div className="studio-version">v2.9.0-AI MUSE</div>
            </div>

            <div className="studio-discovery-tabs">
                <button 
                    className={`studio-tab ${studioMode === 'reel' ? 'active' : ''}`}
                    onClick={() => { setStudioMode('reel'); if(isLive) handleGoLive(); }}
                >
                    <Zap size={16} /> REEL
                </button>
                <button 
                    className={`studio-tab ${studioMode === 'stage' ? 'active' : ''}`}
                    onClick={() => { setStudioMode('stage'); if(isRecording) stopRecording(); }}
                >
                    <Tv size={16} /> STAGE
                </button>
            </div>

            <div className="studio-viewport">
                <canvas ref={canvasRef} className="studio-canvas" />
                {activeFilter.id === 'vintage' && <div className="studio-grain-overlay" />}
                
                {studioMode === 'stage' && isLive && (
                    <div className="stage-viewer-overlay animate-fade-in">
                        <div className="stage-stat-pill">
                            <Users size={14} /> {viewerCount} Viewers
                        </div>
                    </div>
                )}

                {showMuse && (
                    <AIMuse 
                        filterId={activeFilter.id} 
                        mode={studioMode} 
                        onClose={() => setShowMuse(false)} 
                    />
                )}
            </div>

            <div className="studio-footer">
                <div className="studio-filters">
                    {FILTERS.map(filter => (
                        <button 
                            key={filter.id}
                            className={`studio-filter-btn ${activeFilter.id === filter.id ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter.name}
                        </button>
                    ))}
                </div>

                <div 
                    className={`studio-record-btn ${isRecording || isLive ? 'recording' : ''} ${studioMode === 'stage' ? 'stage-mode' : ''}`} 
                    onClick={handleAction}
                >
                    {isRecording && <div className="studio-record-timer">0:{recordTime.toString().padStart(2, '0')}</div>}
                    {isLive && <div className="stage-live-label">LIVE</div>}
                    <div className="inner-circle" />
                </div>
            </div>
        </div>
    );
};

export default Studio;
