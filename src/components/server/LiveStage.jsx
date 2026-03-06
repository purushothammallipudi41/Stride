import { useState, useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import { useMusic } from '../../context/MusicContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useVoice } from '../../context/VoiceContext';
import {
    Music, Users, Heart, Share2, MessageCircle,
    Mic2, Play, Pause, SkipForward, SkipBack,
    Volume2, Radio, Sparkles, Mic, MicOff, Gift,
    Video, VideoOff, Maximize2
} from 'lucide-react';
import config from '../../config';
import giftAnimation from '../../assets/gift-animation.json';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ImmersiveBoard from './ImmersiveBoard';

import './LiveStage.css';


// Spatial Audio Component for individual peers
const SpatialAudioSource = ({ stream, position }) => {
    const pannerRef = useRef();
    const audioCtxRef = useRef();

    useEffect(() => {
        if (!stream) return;

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const panner = audioCtx.createPanner();

        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.rolloffFactor = 1;

        source.connect(panner);
        panner.connect(audioCtx.destination);
        pannerRef.current = panner;

        return () => audioCtx.close();
    }, [stream]);

    useEffect(() => {
        if (pannerRef.current) {
            const { x, y, z } = position;
            const time = audioCtxRef.current.currentTime;
            pannerRef.current.positionX.setValueAtTime(x, time);
            pannerRef.current.positionY.setValueAtTime(y, time);
            pannerRef.current.positionZ.setValueAtTime(z, time);
        }
    }, [position]);

    return null;
};

// 3D Participant Avatar for the stage
const ParticipantAvatar3D = ({ username, position, isSpeaking, color }) => {
    return (
        <Float speed={2} rotationIntensity={isSpeaking ? 2 : 0.5} floatIntensity={1}>
            <mesh position={[position.x, position.y, position.z]}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <MeshDistortMaterial
                    color={color || "#6366f1"}
                    speed={isSpeaking ? 5 : 1}
                    distort={isSpeaking ? 0.4 : 0.2}
                    roughness={0}
                />
            </mesh>
        </Float>
    );
};


const LiveStage = ({ channelId, channelName, onClose }) => {
    const {
        currentTrack, isPlaying, progress,
        playTrack, togglePlay, playNext, playPrevious,
        sessionHost, isHosting, startVibeSession, joinVibeSession, leaveVibeSession
    } = useMusic();
    const {
        joinVoiceChannel, leaveVoiceChannel, currentChannelId, isListener, toggleListener, isMuted, toggleMute,
        localStream, peers
    } = useVoice();
    const { user } = useAuth();
    const { socket } = useSocket();
    const [reactions, setReactions] = useState([]);
    const [gifts, setGifts] = useState([]);
    const [listeners, setListeners] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [hostPeerId, setHostPeerId] = useState(null);
    const [isPiPActive, setIsPiPActive] = useState(false);
    const [currentCaption, setCurrentCaption] = useState(null);
    const [stageSentiment, setStageSentiment] = useState(null);
    const [showRecordOverlay, setShowRecordOverlay] = useState(false);
    const [isMultiplayer, setIsMultiplayer] = useState(false);
    const [isVoiceCloning, setIsVoiceCloning] = useState(false);
    const [voiceRecordDuration, setVoiceRecordDuration] = useState(0);
    const voiceMediaRecorderRef = useRef(null);
    const voiceChunksRef = useRef([]);
    const voiceIntervalRef = useRef(null);
    const chatEndRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleReaction = (data) => {
            setReactions(prev => [...prev, { ...data, id: Math.random() }]);
            // Auto-remove reaction after 3s
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== data.id));
            }, 3000);
        };

        const handleUpdateListeners = (data) => {
            setListeners(data.listeners || []);
        };

        const handleGiftReceived = (data) => {
            setGifts(prev => [...prev, { ...data, id: Math.random() }]);
            // Auto-remove gift animation after 4s
            setTimeout(() => {
                setGifts(prev => prev.filter(g => g.id !== data.id));
            }, 4000);

            // Also show it in chat
            setChatMessages(prev => [...prev, {
                id: Date.now() + Math.random(),
                username: 'System',
                text: `${data.senderName} sent a ${data.giftName}! 🎁`,
                timestamp: new Date()
            }]);
        };

        const handleStageVideoToggled = (data) => {
            setIsVideoActive(data.isVideoEnabled);
            setHostPeerId(data.peerId);

            // If video turned off, clear PiP
            if (!data.isVideoEnabled) {
                setIsPiPActive(false);
                if (document.pictureInPictureElement) {
                    document.exitPictureInPicture();
                }
            }
        };

        const handleVoiceCaption = (data) => {
            // data: { username, text, sentiment }
            setCurrentCaption(data);
            if (data.sentiment) {
                setStageSentiment(data.sentiment);
            }
            // Clear caption after 4s
            setTimeout(() => {
                setCurrentCaption(prev => prev?.text === data.text ? null : prev);
            }, 4000);
        };

        socket.on('new-vibe-reaction', handleReaction);
        socket.on('update-stage-listeners', handleUpdateListeners);
        socket.on('space-gift-received', handleGiftReceived);
        socket.on('stage-video-toggled', handleStageVideoToggled);
        socket.on('voice-caption', handleVoiceCaption);

        // Join the stage room
        if (socket) {
            socket.emit('join-vibe-session', { hostEmail: channelId });
        }

        // Join voice as listener
        joinVoiceChannel(channelId, true);

        return () => {
            if (socket) {
                socket.off('new-vibe-reaction', handleReaction);
                socket.off('update-stage-listeners', handleUpdateListeners);
                socket.off('space-gift-received', handleGiftReceived);
                socket.off('stage-video-toggled', handleStageVideoToggled);
                socket.emit('leave-vibe-session', { hostEmail: channelId });
            }
            leaveVoiceChannel();
        };
    }, [socket, channelId]);

    // Handle host video stream
    useEffect(() => {
        if (!isVideoActive || !videoRef.current) return;

        let stream = null;
        if (isHosting) {
            stream = localStream;
        } else {
            // Find host peer stream
            const hostPeer = peers.find(p => p.peerId === hostPeerId);
            stream = hostPeer?.stream;
        }

        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [isVideoActive, hostPeerId, peers, localStream, isHosting]);

    const sendReaction = (type) => {
        if (socket) {
            socket.emit('send-vibe-reaction', {
                hostEmail: channelId,
                reaction: type,
                username: user.username
            });
        }
    };

    const handleSendGift = async () => {
        try {
            const res = await fetch(`${config.API_URL}/api/spaces/${channelId}/gift`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ giftName: 'Stage Boost', vibeAmount: 10 })
            });

            if (res.ok) {
                const data = await res.json();
                console.log('Gift sent successfully, new balance:', data.newBalance);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to send gift. Do you have enough Vibe Tokens?');
            }
        } catch (error) {
            console.error('Error sending gift:', error);
        }
    };

    const handleToggleVideo = () => {
        const nextState = !isVideoActive;
        // In a real app we'd trigger VoiceContext.toggleVideo
        // For MVP, if host, we start video
        if (isHosting) {
            if (nextState) {
                // Assuming toggleVideo in VoiceContext is already set to handle this
                // We broadcast to the server
                socket.emit('toggle-stage-video', {
                    hostEmail: channelId,
                    isVideoEnabled: true,
                    peerId: socket.id
                });
            } else {
                socket.emit('toggle-stage-video', {
                    hostEmail: channelId,
                    isVideoEnabled: false
                });
            }
            setIsVideoActive(nextState);
        }
    };

    const togglePiP = async () => {
        try {
            if (!isPiPActive) {
                if (videoRef.current) {
                    await videoRef.current.requestPictureInPicture();
                    setIsPiPActive(true);
                }
            } else {
                await document.exitPictureInPicture();
                setIsPiPActive(false);
            }
        } catch (error) {
            console.error('PiP failed:', error);
        }
    };

    const startVoiceSample = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            voiceMediaRecorderRef.current = mediaRecorder;
            voiceChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) voiceChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());

                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64 = reader.result;
                    processVoiceClone(base64);
                };
            };

            mediaRecorder.start();
            setShowRecordOverlay(true);
            setVoiceRecordDuration(0);
            voiceIntervalRef.current = setInterval(() => {
                setVoiceRecordDuration(prev => {
                    if (prev >= 10) {
                        stopVoiceSample();
                        return 10;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            alert('Mic access needed for voice profile');
        }
    };

    const stopVoiceSample = () => {
        if (voiceMediaRecorderRef.current && voiceMediaRecorderRef.current.state !== 'inactive') {
            voiceMediaRecorderRef.current.stop();
        }
        clearInterval(voiceIntervalRef.current);
    };

    const processVoiceClone = async (base64) => {
        setIsVoiceCloning(true);
        try {
            const res = await fetch(`${config.API_URL}/api/ai/voice-clone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioSample: base64, name: user.username })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Voice Profile Active! ID: ${data.voiceId}`);
            }
        } catch (err) {
            console.error('Voice clone failed:', err);
        } finally {
            setIsVoiceCloning(false);
            setShowRecordOverlay(false);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        // In a real app, this would go through a server message endpoint
        // For the demo, we'll just local sync if possible or use socket
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            username: user.username,
            text: newMessage,
            timestamp: new Date()
        }]);
        setNewMessage('');
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    return (
        <div className="live-stage-container animate-fade-in">
            <div className="stage-main-content">
                <div className="stage-header">
                    <div className="stage-title">
                        <Radio className="pulse-red" size={20} />
                        <h2>{channelName}</h2>
                        <div className="listener-count">
                            <Users size={14} />
                            <span>{listeners.length + 1} listening</span>
                        </div>
                    </div>
                </div>

                <div className="stage-visualizer-area">
                    <div className="spatial-canvas-wrapper">
                        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} />
                            <OrbitControls enableZoom={false} enablePan={false} />

                            {/* The Main Stage Energy Sphere */}
                            <group position={[0, 0, 0]}>
                                <Sphere args={[2, 64, 64]}>
                                    <MeshDistortMaterial
                                        color={stageSentiment?.vibeColor || "#6366f1"}
                                        speed={isPlaying ? 3 : 0.5}
                                        distort={isPlaying ? 0.5 : 0.2}
                                        radius={1}
                                    />
                                </Sphere>
                            </group>

                            {/* Remote Participants in 3D Space */}
                            {!isMultiplayer && peers.map((peer, idx) => {
                                const angle = (idx / peers.length) * Math.PI * 2;
                                const radius = 5;
                                const pos = {
                                    x: Math.cos(angle) * radius,
                                    y: Math.sin(angle) * radius,
                                    z: 0
                                };
                                return (
                                    <React.Fragment key={peer.peerId}>
                                        <ParticipantAvatar3D
                                            position={pos}
                                            isSpeaking={true} // In real app, bind to volume detect
                                            username={peer.userId}
                                            color="#ff0055"
                                        />
                                        <SpatialAudioSource stream={peer.stream} position={pos} />
                                    </React.Fragment>
                                );
                            })}

                            {isMultiplayer && (
                                <ImmersiveBoard
                                    socket={socket}
                                    channelId={channelId}
                                    isOwner={isHosting}
                                />
                            )}
                        </Canvas>


                        {/* Traditional Overlay for Art/Video if configured */}
                        <div className="stage-overlay-ui">
                            {currentTrack && !isVideoActive && (
                                <div className="vibe-card-mini glass-card">
                                    <img src={currentTrack.cover} alt="" className="mini-art" />
                                    <div className="mini-info">
                                        <h4>{currentTrack.title}</h4>
                                        <p>{currentTrack.artist}</p>
                                    </div>
                                </div>
                            )}
                            {isVideoActive && (
                                <div className="stage-video-wrapper">
                                    <video ref={videoRef} autoPlay playsInline className="stage-video-feed" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {Object.values(remoteCaptions).map((cap, idx) => (
                    <div key={idx} className="transcription-overlay animate-slide-up">
                        <div className="transcription-content">
                            <strong>{cap.username}:</strong>
                            <div className="caption-texts">
                                <span className="caption-original">{cap.originalText || cap.text}</span>
                                {cap.translatedText && (
                                    <div className="caption-translated">{cap.translatedText}</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}


                {showRecordOverlay && (
                    <div className="voice-recorder-overlay animate-slide-up">
                        <div className="recorder-content glass-card">
                            <div className="recorder-header">
                                <Sparkles size={16} className="pulse-purple" />
                                <span>AI Voice Profile</span>
                            </div>
                            <div className="record-status">
                                {isVoiceCloning ? 'Generating Profile...' : `Recording... ${voiceRecordDuration}/10s`}
                            </div>
                            <div className="record-meter">
                                <div className="meter-fill" style={{ width: `${(voiceRecordDuration / 10) * 100}%` }} />
                            </div>
                            <p className="recorder-hint">Reading a sentence helps AI learn your unique vibe.</p>
                        </div>
                    </div>
                )}

                <div className="stage-controls glass-card">
                    <div className="stage-actions-left">
                        <div className="reaction-bar">
                            <button className="reaction-btn heart" onClick={() => sendReaction('heart')}>
                                <Heart size={24} />
                            </button>
                            <button className="reaction-btn fire" onClick={() => sendReaction('fire')}>
                                <Sparkles size={24} />
                            </button>
                            <button className="reaction-btn gift" onClick={handleSendGift} title="Send Gift (10 Tokens)">
                                <Gift size={24} />
                            </button>
                        </div>

                        {!isListener && (
                            <button
                                className={`control-btn ${showRecordOverlay ? 'active' : ''}`}
                                onClick={() => showRecordOverlay ? stopVoiceSample() : startVoiceSample()}
                                title="AI Voice Profile"
                            >
                                <Sparkles size={20} />
                            </button>
                        )}
                        <button
                            className={`stage-mic-btn ${isMultiplayer ? 'active' : ''}`}
                            onClick={() => setIsMultiplayer(!isMultiplayer)}
                            title="Toggle Multiplayer 3D Board"
                        >
                            <Maximize2 size={18} />
                            <span>Board</span>
                        </button>
                        <button
                            className={`stage-mic-btn ${isListener ? 'listener' : 'speaker'}`}
                            onClick={toggleListener}
                        >
                            {isListener ? <MicOff size={20} /> : <Mic size={20} />}
                            <span>{isListener ? 'Request to Speak' : 'Stop Speaking'}</span>
                        </button>

                        {isHosting && (
                            <button
                                className={`control-btn ${isVideoActive ? 'vibe-accent-bg' : ''}`}
                                onClick={handleToggleVideo}
                                title={isVideoActive ? "Stop Video" : "Start Video"}
                            >
                                {isVideoActive ? <Video size={20} /> : <VideoOff size={20} />}
                            </button>
                        )}

                        {!isListener && (
                            <button className={`control-btn ${isMuted ? 'danger' : ''}`} onClick={toggleMute}>
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                        )}
                    </div>

                    {currentTrack && (
                        <div className="playback-mini">
                            <button className="control-btn" onClick={playPrevious}><SkipBack size={20} /></button>
                            <button className="play-btn-large" onClick={togglePlay}>
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <button className="control-btn" onClick={playNext}><SkipForward size={20} /></button>
                        </div>
                    )}
                </div>
            </div>

            <aside className="stage-chat glass-card">
                <div className="chat-header">
                    <h3>Live Chat</h3>
                </div>
                <div className="chat-messages premium-scrollbar">
                    {chatMessages.map(m => (
                        <div key={m.id} className="chat-msg">
                            <span className="msg-user">{m.username}: </span>
                            <span className="msg-text">{m.text}</span>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        placeholder="Say something..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit"><MessageCircle size={18} /></button>
                </form>
            </aside>
        </div>
    );
};

export default LiveStage;
