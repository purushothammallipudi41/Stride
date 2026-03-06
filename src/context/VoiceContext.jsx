import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import SimplePeer from 'simple-peer';
import config from '../config';

const VoiceContext = createContext({
    peers: [], // Array of { peerId, stream }
    joinVoiceChannel: (channelId, asListener = false) => { },
    leaveVoiceChannel: () => { },
    currentChannelId: null,
    localStream: null,
    isMuted: false,
    isDeafened: false,
    isListener: false,
    toggleMute: () => { },
    toggleDeafen: () => { },
    toggleVideo: () => { },
    toggleListener: () => { },
    toggleScreenShare: () => { },
    toggleTranscription: () => { },
    isVideoEnabled: false,
    isScreenSharing: false,
    isTranscribing: false,
    screenStream: null,
    transcript: "",
    remoteCaptions: {}, // userId -> { username, text, timestamp, translatedText }
    targetLanguage: 'en',
    setTargetLanguage: (lang) => { }
});

export const useVoice = () => useContext(VoiceContext);

export const VoiceProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();

    // State
    const [peers, setPeers] = useState([]); // [{ peerId, peer: SimplePeerInstance, stream }]
    const [currentChannelId, setCurrentChannelId] = useState(null);
    const [localStream, setLocalStream] = useState(null);

    // Medial controls
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [remoteCaptions, setRemoteCaptions] = useState({});
    const [screenStream, setScreenStream] = useState(null);
    const [isListener, setIsListener] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState('English'); // Default to English

    const [voiceParticipants, setVoiceParticipants] = useState({}); // channelId -> [participants]

    // Refs for cleanup and access in callbacks
    const peersRef = useRef([]); // [{ peerId, peer }]
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const socketRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        socketRef.current = socket;

        if (socket) {
            // Handle signal from another peer
            socket.on("voice-signal", handleReceiveSignal);

            // Handle when a new user joins (WE call THEM)
            socket.on("user-joined-voice", handleUserJoined);

            // Handle when a user leaves
            socket.on("user-left-voice", handleUserLeft);
            socket.on("voice-participants-update", handleParticipantsUpdate);
            socket.on("voice-caption", async (data) => {
                let textToDisplay = data.text;
                let translatedText = null;

                if (targetLanguage && targetLanguage !== 'Original') {
                    try {
                        const res = await fetch(`${config.API_URL}/api/ai/translate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: data.text, targetLanguage })
                        });
                        if (res.ok) {
                            const result = await res.json();
                            translatedText = result.translatedText;
                        }
                    } catch (e) {
                        console.error("[VOICE] Translation failed:", e);
                    }
                }

                setRemoteCaptions(prev => {
                    const existing = prev[data.userId] || {};
                    // Only update if it's a newer caption or we have fresh translation
                    return {
                        ...prev,
                        [data.userId]: {
                            ...data,
                            originalText: data.text,
                            translatedText: translatedText || existing.translatedText,
                            timestamp: Date.now()
                        }
                    };
                });

            });
        }
        return () => {
            if (socket) {
                socket.off("voice-signal", handleReceiveSignal);
                socket.off("user-joined-voice", handleUserJoined);
                socket.off("user-left-voice", handleUserLeft);
                socket.off("voice-participants-update", handleParticipantsUpdate);
                socket.off("voice-caption");
            }
        };
    }, [socket, currentChannelId]);

    function handleParticipantsUpdate({ channelId, participants }) {
        setVoiceParticipants(prev => ({ ...prev, [channelId]: participants }));
    }

    // 1. Join Channel
    const joinVoiceChannel = async (channelId, asListener = false) => {
        if (currentChannelId === channelId) return;
        if (currentChannelId) leaveVoiceChannel(); // Leave existing first

        setCurrentChannelId(channelId);
        setIsListener(asListener);

        try {
            let stream = null;
            if (!asListener) {
                // Get Local Stream
                stream = await navigator.mediaDevices.getUserMedia({
                    video: isVideoEnabled,
                    audio: true
                });
                setLocalStream(stream);
                localStreamRef.current = stream;
            }

            // Emit join to server
            socketRef.current.emit("join-voice", {
                channelId,
                userId: user.email || user.username,
                peerId: socketRef.current.id,
                asListener
            });

            console.log(`[VOICE] Joined ${channelId} (asListener: ${asListener})`);
        } catch (err) {
            console.error("[VOICE] Error accessing media devices:", err);
            // Join even if media fails, but as a listener
            setIsListener(true);
            socketRef.current.emit("join-voice", {
                channelId,
                userId: user.email || user.username,
                peerId: socketRef.current.id,
                asListener: true
            });
        }
    };

    // 2. Leave Channel
    const leaveVoiceChannel = () => {
        if (!currentChannelId) return;

        console.log(`[VOICE] Leaving ${currentChannelId}`);

        // Notify server
        if (socketRef.current) {
            socketRef.current.emit("leave-voice", {
                channelId: currentChannelId,
                userId: user.email
            });
        }

        // Destroy all peers
        peersRef.current.forEach(({ peer }) => {
            if (peer) peer.destroy();
        });
        peersRef.current = [];
        setPeers([]);

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        setScreenStream(null);
        setIsScreenSharing(false);

        setLocalStream(null);
        setCurrentChannelId(null);
        setIsListener(false); // Reset listener status
    };

    // 3. Handle New User Joined (We are initiator)
    const handleUserJoined = (payload) => {
        // payload: { userId, peerId (socketId of new user) }
        const peerId = payload.socketId || payload.peerId;

        // If we are a listener, we don't create peers
        if (isListener) {
            console.log(`[VOICE] As listener, not creating peer for ${peerId}`);
            return;
        }

        const peer = createPeer(peerId, socketRef.current.id, localStreamRef.current);

        peersRef.current.push({
            peerId,
            peer,
            userId: payload.userId
        });

        // Add to state (stream will be added later on 'stream' event, but we need placeholder)
        setPeers(prev => [...prev, { peerId, peer, userId: payload.userId, stream: null }]);
    };

    // 4. Handle Incoming Signal (We are receiver or answering handshake)
    const handleReceiveSignal = (payload) => {
        // payload: { signal, callerId, metadata }
        const item = peersRef.current.find(p => p.peerId === payload.callerId);

        // If we are a listener, we don't process signals
        if (isListener) {
            console.log(`[VOICE] As listener, not processing signal from ${payload.callerId}`);
            return;
        }

        if (item) {
            // Peer already exists (we initiated, correct this is the answer)
            // Peer already exists (we initiated, correct this is the answer)
            item.peer.signal(payload.signal);
        } else {
            // Peer doesn't exist (they initiated, we accept)
            // Peer doesn't exist (they initiated, we accept)
            const peer = addPeer(payload.signal, payload.callerId, localStreamRef.current);

            const userId = payload.metadata?.userId || 'Unknown';

            peersRef.current.push({
                peerId: payload.callerId,
                peer,
                userId
            });

            setPeers(prev => [...prev, { peerId: payload.callerId, peer, userId, stream: null }]);
        }
    };

    // 5. Handle User Left
    const handleUserLeft = ({ userId }) => {
        console.log(`[VOICE] User left: ${userId}`);
        const peerToRemove = peersRef.current.find(p => p.userId === userId);
        if (peerToRemove) {
            if (peerToRemove.peer) peerToRemove.peer.destroy();
            removePeer(peerToRemove.peerId);
        }
    };

    // Helper: Create Peer (Initiator)
    const createPeer = (userToSignal, callerId, stream) => {
        const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("voice-signal", {
                targetId: userToSignal,
                callerId,
                signal,
                metadata: { userId: user.email }
            });
        });

        peer.on("stream", stream => {
            // Check if this is a screen share or normal video
            // In a more complex app, we'd use track metadata. 
            // Here, we'll check if the peer already has a stream.
            setPeers(prev => prev.map(p => {
                if (p.peerId === userToSignal) {
                    if (p.stream && p.stream.id !== stream.id) {
                        return { ...p, screenStream: stream };
                    }
                    return { ...p, stream };
                }
                return p;
            }));
        });

        peer.on("close", () => {
            console.log(`[VOICE] Peer closed: ${userToSignal}`);
            removePeer(userToSignal);
        });

        peer.on("error", (err) => {
            console.error(`[VOICE] Peer error ${userToSignal}:`, err);
            // removePeer(userToSignal);
        });

        return peer;
    };

    // Helper: Add Peer (Receiver)
    const addPeer = (incomingSignal, callerId, stream) => {
        const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("voice-signal", {
                targetId: callerId,
                callerId: socketRef.current.id,
                signal,
                metadata: { userId: user.email }
            });
        });

        peer.on("stream", stream => {
            setPeers(prev => prev.map(p => {
                if (p.peerId === callerId) {
                    if (p.stream && p.stream.id !== stream.id) {
                        return { ...p, screenStream: stream };
                    }
                    return { ...p, stream };
                }
                return p;
            }));
        });

        peer.on("close", () => {
            console.log(`[VOICE] Peer closed: ${callerId}`);
            removePeer(callerId);
        });

        peer.on("error", (err) => {
            console.error(`[VOICE] Peer error ${callerId}:`, err);
        });

        peer.signal(incomingSignal);

        return peer;
    };

    const removePeer = (peerId) => {
        setPeers(prev => prev.filter(p => p.peerId !== peerId));
        peersRef.current = peersRef.current.filter(p => p.peerId !== peerId);
    };

    // Toggles
    const toggleMute = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMuted(!track.enabled);
            }
        } else if (!isListener && currentChannelId) {
            // If no stream but not a listener, try to get stream again (e.g., after a device change or error)
            joinVoiceChannel(currentChannelId, false);
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                setScreenStream(stream);
                screenStreamRef.current = stream;
                setIsScreenSharing(true);

                // Add stream to all peers
                peersRef.current.forEach(({ peer }) => {
                    peer.addStream(stream);
                });

                // Handle stop from browser UI
                stream.getVideoTracks()[0].onended = () => {
                    stopScreenShare();
                };
            } catch (err) {
                console.error("[VOICE] Error starting screen share:", err);
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = () => {
        if (screenStreamRef.current) {
            const stream = screenStreamRef.current;
            peersRef.current.forEach(({ peer }) => {
                peer.removeStream(stream);
            });
            stream.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
            setScreenStream(null);
            setIsScreenSharing(false);
        }
    };

    // Auto-clear old captions after 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setRemoteCaptions(prev => {
                const updated = { ...prev };
                let changed = false;
                Object.keys(updated).forEach(id => {
                    if (now - updated[id].timestamp > 5000) {
                        delete updated[id];
                        changed = true;
                    }
                });
                return changed ? updated : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleTranscription = () => {
        if (!isTranscribing) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.error("Speech Recognition not supported in this browser.");
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);

                // Broadcast to others in the channel? 
                // For MVP, let's keep it local accessibility (captions for the user).
                // But it's better if we broadcast our transcription so others can see it as captions for US.
                // Broadcast optimization: Only send if we have a substantial delta or it's final
                const isFinal = event.results[event.results.length - 1].isFinal;
                if (socketRef.current && currentChannelId && (isFinal || currentTranscript.length > 20)) {
                    socketRef.current.emit('voice-caption', {
                        channelId: currentChannelId,
                        userId: user.email,
                        username: user.username,
                        text: currentTranscript,
                        isFinal
                    });
                }

            };

            recognition.onerror = (e) => console.error("Speech Recog Error:", e);
            recognition.onend = () => {
                if (isTranscribing) recognition.start(); // Auto-restart if we didn't stop it 
            };

            recognition.start();
            recognitionRef.current = recognition;
            setIsTranscribing(true);
        } else {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
            setIsTranscribing(false);
            setTranscript("");
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsVideoEnabled(!track.enabled);
            } else {
                // Video was not requested initially or track missing.
                // To support "turning on" video later, we'd need to negotiate new tracks (re-negotiation).
                // For MVP, we stick to toggle enabled/disabled if track exists.
                // Or we could restart stream.
                // If video track doesn't exist, try to re-get media with video enabled
                if (!isVideoEnabled && currentChannelId) {
                    joinVoiceChannel(currentChannelId, false);
                }
            }
        } else if (!isListener && currentChannelId) {
            // If no stream but not a listener, try to get stream again
            joinVoiceChannel(currentChannelId, false);
        }
    };

    return (
        <VoiceContext.Provider value={{
            peers,
            joinVoiceChannel,
            leaveVoiceChannel,
            currentChannelId,
            localStream,
            isMuted,
            isListener,
            isScreenSharing,
            isTranscribing,
            transcript,
            remoteCaptions,
            screenStream,
            voiceParticipants,
            targetLanguage,
            setTargetLanguage,
            toggleMute,
            toggleVideo,
            toggleScreenShare,
            toggleTranscription,
            toggleListener: async () => {
                // Logic to transition from listener to speaker
                if (isListener) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: isVideoEnabled, audio: true });
                        setLocalStream(stream);
                        localStreamRef.current = stream;
                        setIsListener(false);
                        // In a real P2P mesh, we might need to re-negotiate with all peers
                        // but SimplePeer's 'stream' update usually handles it if we replace the track
                        peersRef.current.forEach(({ peer }) => {
                            // Remove existing tracks if any, then add new ones
                            if (peer.streams && peer.streams[0]) {
                                peer.streams[0].getTracks().forEach(track => peer.removeTrack(track, peer.streams[0]));
                            }
                            stream.getTracks().forEach(track => peer.addTrack(track, stream));
                        });
                    } catch (e) { console.error(e); }
                } else {
                    leaveVoiceChannel();
                    joinVoiceChannel(currentChannelId, true);
                }
            }
        }}>
            {children}
        </VoiceContext.Provider>
    );
};
