import { useState, useEffect } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Phone, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { useCall } from '../../context/CallContext';
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

    useEffect(() => {
        const getMedia = async () => {
            try {
                const currentStream = await navigator.mediaDevices.getUserMedia({
                    video: type === 'video',
                    audio: true
                });
                setStream(currentStream);
                setLocalStream(currentStream);
                if (myVideo.current) myVideo.current.srcObject = currentStream;

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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Render Logic based on State
    if (callState === 'INCOMING') {
        return (
            <div className="call-overlay glass-panel">
                <div className="incoming-call-alert">
                    <div className="call-avatar large pulse-ring" style={{ backgroundImage: `url(https://i.pravatar.cc/150?u=${caller?.username})` }} />
                    <h2>{caller?.username || 'Unknown'}</h2>
                    <p>Incoming {type} Call...</p>
                    <div className="call-actions">
                        <button className="call-btn decline" onClick={onEndCall}><Phone size={24} /></button>
                        <button className="call-btn accept" onClick={handleAnswer}><Phone size={24} /></button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="call-overlay">
            {/* Remote Video (Full Screen) */}
            <video ref={userVideo} playsInline autoPlay className="remote-video" />

            {!userVideo.current?.srcObject && callState !== 'CONNECTED' && (
                <div className="remote-video-placeholder">
                    <div className="call-avatar large pulse-ring" style={{ backgroundImage: `url(https://i.pravatar.cc/150?u=${username})` }} />
                    <h2>{username}</h2>
                    <p>{callState === 'OUTGOING' ? 'Calling...' : 'Connecting...'}</p>
                </div>
            )}

            {/* Local Video (PiP) */}
            <div className="local-video-container glass-card">
                <video ref={myVideo} muted autoPlay playsInline className="local-video" />
            </div>

            {/* Controls */}
            <div className="call-controls glass-card">
                <div className="time-badge">{formatTime(duration)}</div>

                <button className={`control-btn ${!isMuted ? 'active' : 'inactive'}`} onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <button className={`control-btn ${isVideoOn ? 'active' : 'inactive'}`} onClick={() => setIsVideoOn(!isVideoOn)}>
                    {isVideoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
                </button>

                <button className="control-btn end-call" onClick={onEndCall}>
                    <Phone size={24} style={{ transform: 'rotate(135deg)' }} />
                </button>
            </div>
        </div>
    );
};

export default CallOverlay;
