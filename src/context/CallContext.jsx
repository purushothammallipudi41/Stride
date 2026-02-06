import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext({
    callState: 'IDLE',
    startCall: () => console.warn('CallContext: startCall not implemented'),
    endCall: () => { },
    answerCall: () => { },
    myVideo: { current: null },
    userVideo: { current: null }
});

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();

    const [callState, setCallState] = useState('IDLE'); // IDLE, INCOMING, OUTGOING, CONNECTED
    const [callType, setCallType] = useState(null); // 'audio', 'video'
    const [caller, setCaller] = useState(null); // Who is calling us
    const [callee, setCallee] = useState(null); // Who we are calling

    // WebRTC refs
    const socketRef = useRef();
    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const [localStream, setLocalStream] = useState(null);
    const [incomingSignal, setIncomingSignal] = useState(null);

    useEffect(() => {
        if (socket) {
            socketRef.current = socket;

            socket.on('call-user', ({ from, name: callerName, signal }) => {
                console.log("[CALL] Incoming call from", callerName);
                setCallState('INCOMING');
                setCaller({ id: from, username: callerName }); // In a real app, 'from' is ID, we might need lookup or pass username
                setIncomingSignal(signal);
                setCallType('video'); // Default or pass in signal metadata
            });

            socket.on('call-accepted', (signal) => {
                console.log("[CALL] Call accepted!");
                setCallState('CONNECTED');
                connectionRef.current.signal(signal);
            });
        }
    }, [socket]);

    const startCall = (userToCall, type = 'video') => {
        setCallState('OUTGOING');
        setCallType(type);
        setCallee(userToCall);

        // We will initialize the stream and peer in CallOverlay or here.
        // For separation of concerns, CallOverlay handles the UI and getUserMedia,
        // but the Context holds the state.
        // Actually, it's better if the Overlay handles the streams to ensure they are attached to DOM.
    };

    const answerCall = () => {
        setCallState('CONNECTED');
    };

    const endCall = () => {
        setCallState('IDLE');
        if (connectionRef.current) connectionRef.current.destroy();
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        // Notify other user? Logic handled in Overlay or socket disconnect
        window.location.reload(); // Simple cleanup for now or granular reset
    };

    return (
        <CallContext.Provider value={{
            callState,
            callType,
            caller,
            callee,
            startCall,
            answerCall,
            endCall,
            incomingSignal,
            socketRef,
            connectionRef,
            myVideo,
            userVideo,
            localStream,
            setLocalStream
        }}>
            {children}
        </CallContext.Provider>
    );
};
