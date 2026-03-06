import { useState, useEffect } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Phone, Settings, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { getImageUrl } from '../../utils/imageUtils';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

import './CallOverlay.css';

const CallOverlay = ({ username, type, onEndCall }) => {
    const {
        callState,
        answerCall,
        myVideo,
        userVideo,
        connectionRef,
        socketRef,
        caller,
        callee,
        incomingSignal,
        setLocalStream
    } = useCall();

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(type === 'video');
    const [duration, setDuration] = useState(0);
    const [stream, setStream] = useState(null);
    const [isAIEnabled, setIsAIEnabled] = useState(false);
    const canvasRef = useRef(document.createElement('canvas'));
    const maskedStreamRef = useRef(null);


    useEffect(() => {
        const getMedia = async () => {
            try {
                const currentStream = await navigator.mediaDevices.getUserMedia({
                    video: type === 'video',
                    audio: true
                });
                setStream(currentStream);

                // If AI is enabled, we'll process the stream shortly
                if (!isAIEnabled) {
                    setLocalStream(currentStream);
                    if (myVideo.current) myVideo.current.srcObject = currentStream;
                } else {
                    startAIProcessing(currentStream);
                }


                // Initiate Call if we are the caller (OUTGOING)
                if (callState === 'OUTGOING') {
                    const peer = new RTCPeerConnection({
                        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                    });

                    currentStream.getTracks().forEach(track => peer.addTrack(track, currentStream));

                    peer.onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current.emit('ice-candidate', {
                                target: callee.id || callee.username, // Using username as ID for demo if ID missing
                                candidate: event.candidate
                            });
                        }
                    };

                    peer.ontrack = (event) => {
                        if (userVideo.current) userVideo.current.srcObject = event.streams[0];
                    };

                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);

                    socketRef.current.emit("call-user", {
                        userToCall: callee.id || callee.username, // mapping need
                        signalData: offer,
                        from: socketRef.current.id,
                        name: "Me" // Replace with actual user name
                    });

                    connectionRef.current = peer;
                }
            } catch (err) {
                console.error("Error accessing media:", err);
            }
        };

        getMedia();
    }, [callState, type]);

    // Handle Incoming Call Answer
    const handleAnswer = async () => {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        connectionRef.current = peer;

        if (stream) {
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
        }

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ice-candidate', {
                    target: caller.id,
                    candidate: event.candidate
                });
            }
        };

        peer.ontrack = (event) => {
            console.log("[CALL] Received remote track");
            if (userVideo.current) userVideo.current.srcObject = event.streams[0];
        };

        try {
            await peer.setRemoteDescription(new RTCSessionDescription(incomingSignal));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socketRef.current.emit("answer-call", {
                signal: answer,
                to: caller.id
            });

            answerCall(); // Update state to CONNECTED
        } catch (err) {
            console.error("[CALL] Answer error:", err);
        }
    };

    // Listen for ICE candidates (needs to be attached to socket in effect, but we have socketRef)
    useEffect(() => {
        if (!socketRef.current) return;

        socketRef.current.on('ice-candidate', async (candidate) => {
            if (connectionRef.current) {
                try {
                    await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding ice candidate", e);
                }
            }
        });

        return () => {
            socketRef.current.off('ice-candidate');
        };
    }, []);


    useEffect(() => {
        let interval;
        if (callState === 'CONNECTED') {
            interval = setInterval(() => setDuration(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [callState]);

    const startAIProcessing = (sourceStream) => {
        if (!sourceStream.getVideoTracks().length) return;

        const videoElement = document.createElement('video');
        videoElement.srcObject = sourceStream;
        videoElement.play();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
        });

        selfieSegmentation.setOptions({ modelSelection: 1 });
        selfieSegmentation.onResults((results) => {
            canvas.width = results.image.width;
            canvas.height = results.image.height;

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

            // Use the mask to draw the person
            ctx.globalCompositeOperation = 'source-in';
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            // Draw Stride-themed background
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#1e1b4b'; // Deep Stride Indigo
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add a subtle gradient/glow
            const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width);
            grad.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.restore();
        });

        const processFrame = async () => {
            if (videoElement.paused || videoElement.ended) return;
            await selfieSegmentation.send({ image: videoElement });
            requestAnimationFrame(processFrame);
        };

        videoElement.onloadeddata = () => {
            processFrame();
            const processedStream = canvas.captureStream(30);

            // Add original audio track back
            sourceStream.getAudioTracks().forEach(track => processedStream.addTrack(track));

            maskedStreamRef.current = processedStream;
            setLocalStream(processedStream);
            if (myVideo.current) myVideo.current.srcObject = processedStream;
        };
    };

    const toggleAI = () => {
        const nextState = !isAIEnabled;
        setIsAIEnabled(nextState);
        if (nextState && stream) {
            startAIProcessing(stream);
        } else if (!nextState && stream) {
            setLocalStream(stream);
            if (myVideo.current) myVideo.current.srcObject = stream;
        }
    };


    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Render Logic based on State
    if (callState === 'INCOMING') {
        return (
            <div className="call-overlay">
                <div className="incoming-call-alert">
                    <div className="call-avatar large pulse-ring" style={{ backgroundImage: `url(${getImageUrl(caller?.avatar, 'user') || getImageUrl(null, 'user')})` }} />
                    <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>{caller?.username || 'Unknown'}</h2>
                    <p style={{ color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: '500' }}>Incoming {type} Call...</p>
                    <div className="call-actions">
                        <button className="call-btn decline" onClick={onEndCall}><Phone size={28} /></button>
                        <button className="call-btn accept" onClick={handleAnswer}><Phone size={28} /></button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="call-overlay">
            {/* Remote Video (Full Screen) */}
            <div className="remote-video-container" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                <video ref={userVideo} playsInline autoPlay className="remote-video" />
                <div className="video-scrim" />

                {/* Status Indicator for Remote User */}
                <div className="status-indicator">
                    {/* Note: In a real app, these states would be synced via socket */}
                    <div className="status-icon-pill"><MicOff size={14} /></div>
                    <div className="status-icon-pill"><VideoOff size={14} /></div>
                </div>
            </div>

            {!userVideo.current?.srcObject && callState !== 'CONNECTED' && (
                <div className="remote-video-placeholder">
                    <div className="call-avatar large pulse-ring" style={{ backgroundImage: `url(${getImageUrl(null, 'user')})` }} />
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '700' }}>{username}</h2>
                    <p style={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {callState === 'OUTGOING' ? 'Calling...' : 'Connecting...'}
                    </p>
                </div>
            )}

            {/* Local Video (PiP) */}
            <div className="local-video-container">
                <video ref={myVideo} muted autoPlay playsInline className="local-video" />
                {!isVideoOn && (
                    <div className="video-off-overlay">
                        <VideoOff size={24} opacity={0.5} />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="call-controls">
                <div className="time-badge">{formatTime(duration)}</div>

                <button
                    className={`control-btn ${!isMuted ? 'active' : 'inactive'}`}
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <button
                    className={`control-btn ${isVideoOn ? 'active' : 'inactive'}`}
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
                >
                    {isVideoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
                </button>

                <button
                    className={`control-btn ${isAIEnabled ? 'active' : ''}`}
                    onClick={toggleAI}
                    title="AI Background Removal"
                    style={isAIEnabled ? { color: 'var(--vibe-accent)' } : {}}
                >
                    <Sparkles size={20} />
                </button>


                <button
                    className="control-btn end-call"
                    onClick={onEndCall}
                    title="End Call"
                >
                    <Phone size={24} style={{ transform: 'rotate(135deg)' }} />
                </button>
            </div>
        </div>
    );
};

export default CallOverlay;
