import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, RefreshCcw, Download } from 'lucide-react';
import './Studio.css';

const FILTERS = [
    { id: 'normal', name: 'Normal', css: 'none' },
    { id: 'cyberpunk', name: 'Neon Rush', css: 'hue-rotate(90deg) saturate(200%) contrast(120%)' },
    { id: 'vintage', name: 'Vintage', css: 'sepia(60%) contrast(110%) brightness(90%)' },
    { id: 'noir', name: 'Noir', css: 'grayscale(100%) contrast(150%) brightness(110%)' }
];

const Studio = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    
    const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordTime, setRecordTime] = useState(0);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [isCameraReady, setIsCameraReady] = useState(false);

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

    const handleRecord = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
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
                    <Camera size={24} /> 
                    Stride Studio 
                    {isRecording && <span className="studio-live-badge">REC</span>}
                </h1>
                <button className="studio-icon-btn" onClick={startCamera}>
                    <RefreshCcw size={20} />
                </button>
            </div>

            <div className="studio-viewport">
                <canvas ref={canvasRef} className="studio-canvas" />
                {activeFilter.id === 'vintage' && <div className="studio-grain-overlay" />}
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

                <div className={`studio-record-btn ${isRecording ? 'recording' : ''}`} onClick={handleRecord}>
                    {isRecording && <div className="studio-record-timer">0:{recordTime.toString().padStart(2, '0')}</div>}
                    <div className="inner-circle" />
                </div>
            </div>
        </div>
    );
};

export default Studio;
