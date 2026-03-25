import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2, Minimize2, X } from 'lucide-react';
import socket from '../../services/socket';
import './CallOverlay.css';

const CallOverlay = ({ isOpen, isIncoming, callerData, onReject, onEnd, callType = 'video' }) => {
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
    const [isAccepted, setIsAccepted] = useState(!isIncoming);
    
    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    const callUser = useCallback(() => {
        const peer = new Peer({ initiator: true, trickle: false, stream: stream });

        peer.on('signal', (data) => {
            socket.emit('call-user', {
                userToCall: callerData.username,
                signalData: data,
                from: JSON.parse(localStorage.getItem('user') || '{}').username,
                name: JSON.parse(localStorage.getItem('user') || '{}').name,
                type: callType
            });
        });

        peer.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            if (userVideo.current) userVideo.current.srcObject = remoteStream;
        });

        socket.on('call-accepted', (signal) => {
            setIsAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
    }, [stream, callerData, callType]);

    const answerCall = useCallback(() => {
        const peer = new Peer({ initiator: false, trickle: false, stream: stream });

        peer.on('signal', (data) => {
            socket.emit('answer-call', { signal: data, to: callerData.from });
        });

        peer.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            if (userVideo.current) userVideo.current.srcObject = remoteStream;
        });

        peer.signal(callerData.signal);
        connectionRef.current = peer;
    }, [stream, callerData]);

    useEffect(() => {
        if (!isOpen) return;

        navigator.mediaDevices.getUserMedia({ video: callType === 'video', audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) myVideo.current.srcObject = currentStream;
            })
            .catch(err => console.error("Failed to get media devices:", err));

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (connectionRef.current) {
                connectionRef.current.destroy();
            }
        };
    }, [isOpen, callType, stream]);

    useEffect(() => {
        if (isAccepted && stream && !connectionRef.current) {
            if (isIncoming) {
                answerCall();
            } else {
                callUser();
            }
        }
    }, [isAccepted, stream, isIncoming, answerCall, callUser]);

    const leaveCall = () => {
        if (onEnd) onEnd();
        socket.emit('end-call', { to: callerData.username || callerData.from });
        if (connectionRef.current) connectionRef.current.destroy();
        window.location.reload(); // Quick reset
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (stream && callType === 'video') {
            stream.getVideoTracks()[0].enabled = isVideoOff;
            setIsVideoOff(!isVideoOff);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="call-overlay-container glass-panel">
            {!isAccepted && isIncoming ? (
                <div className="incoming-call-box animate-bounce-in">
                    <div className="caller-info">
                        <div className="caller-avatar">
                            {callerData.name?.[0] || 'U'}
                        </div>
                        <h3>{callerData.name} is calling...</h3>
                        <p>{callType === 'video' ? 'Video Call' : 'Audio Call'}</p>
                    </div>
                    <div className="call-actions">
                        <button className="accept-btn" onClick={() => setIsAccepted(true)}>
                            <Phone size={24} />
                        </button>
                        <button className="reject-btn" onClick={onReject}>
                            <PhoneOff size={24} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="active-call-layout">
                    <div className="remote-video-container">
                        {remoteStream ? (
                            <video playsInline ref={userVideo} autoPlay className="remote-video" />
                        ) : (
                            <div className="calling-placeholder">
                                <div className="pulse-circle"></div>
                                <p>Calling {callerData.name || callerData.username}...</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="my-video-container">
                        <video playsInline muted ref={myVideo} autoPlay className="my-video" />
                    </div>

                    <div className="call-controls-bar">
                        <button className={`control-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
                            {isMuted ? <MicOff /> : <Mic />}
                        </button>
                        {callType === 'video' && (
                            <button className={`control-btn ${isVideoOff ? 'active' : ''}`} onClick={toggleVideo}>
                                {isVideoOff ? <VideoOff /> : <Video />}
                            </button>
                        )}
                        <button className="control-btn end-btn" onClick={leaveCall}>
                            <PhoneOff />
                        </button>
                    </div>

                    <button className="minimize-call-btn" onClick={onReject}>
                        <Minimize2 />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CallOverlay;
