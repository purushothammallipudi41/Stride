import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import SimplePeer from 'simple-peer';

const VoiceContext = createContext({
    peers: [], // Array of { peerId, stream }
    joinVoiceChannel: () => { },
    leaveVoiceChannel: () => { },
    currentChannelId: null,
    localStream: null,
    isMuted: false,
    isDeafened: false,
    toggleMute: () => { },
    toggleDeafen: () => { },
    toggleVideo: () => { },
    isVideoEnabled: true
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

    // Refs for cleanup and access in callbacks
    const peersRef = useRef([]); // [{ peerId, peer }]
    const localStreamRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = socket;

        if (socket) {
            // Handle signal from another peer
            socket.on("voice-signal", handleReceiveSignal);

            // Handle when a new user joins (WE call THEM)
            socket.on("user-joined-voice", handleUserJoined);

            // Handle when a user leaves
            socket.on("user-left-voice", handleUserLeft);
        }

        return () => {
            if (socket) {
                socket.off("voice-signal", handleReceiveSignal);
                socket.off("user-joined-voice", handleUserJoined);
                socket.off("user-left-voice", handleUserLeft);
            }
        };
    }, [socket, currentChannelId]); // Re-bind if channel changes, though listeners are global usually

    // 1. Join Channel
    const joinVoiceChannel = async (channelId) => {
        if (currentChannelId === channelId) return;
        if (currentChannelId) leaveVoiceChannel(); // Leave existing first

        setCurrentChannelId(channelId); // Optimistic

        try {
            // Get Local Stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideoEnabled,
                audio: true
            });
            setLocalStream(stream);
            localStreamRef.current = stream;

            // Emit join to server
            socketRef.current.emit("join-voice", {
                channelId,
                userId: user.email,
                peerId: socketRef.current.id
            });

            console.log(`[VOICE] Joined ${channelId}`);
        } catch (err) {
            console.error("[VOICE] Error accessing media devices:", err);
            leaveVoiceChannel();
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
        setLocalStream(null);
        setCurrentChannelId(null);
    };

    // 3. Handle New User Joined (We are initiator)
    const handleUserJoined = (payload) => {
        // payload: { userId, peerId (socketId of new user) }
        const peerId = payload.socketId || payload.peerId;

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
            setPeers(prev => prev.map(p => p.peerId === userToSignal ? { ...p, stream } : p));
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
            setPeers(prev => prev.map(p => p.peerId === callerId ? { ...p, stream } : p));
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
            }
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
            isVideoEnabled,
            toggleMute,
            toggleVideo
        }}>
            {children}
        </VoiceContext.Provider>
    );
};
