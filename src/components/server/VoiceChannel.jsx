import React, { useEffect, useRef } from 'react';
import { useVoice } from '../../context/VoiceContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, ChevronLeft } from 'lucide-react';
import './VoiceChannel.css';

const VideoPlayer = ({ stream, isLocal = false, username }) => {
    const videoRef = useRef();

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className={`video-card ${isLocal ? 'local-video' : ''}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className="video-element"
            />
            <div className="video-overlay">
                <span className="participant-name">{username || (isLocal ? 'You' : 'User')}</span>
            </div>
        </div>
    );
};

const VoiceChannel = ({ channelId, channelName, onClose }) => {
    const {
        joinVoiceChannel,
        leaveVoiceChannel,
        currentChannelId,
        peers,
        localStream,
        isMuted,
        isVideoEnabled,
        toggleMute,
        toggleVideo
    } = useVoice();

    useEffect(() => {
        // Auto-join on mount if not already in THIS channel
        if (channelId !== currentChannelId) {
            joinVoiceChannel(channelId);
        }

        // Cleanup handled by context logic if we want persistent voice, 
        // but if we want to leave when this UI unmounts:
        // return () => leaveVoiceChannel();
        // For Discord-style, voice persists even if you navigate away (minimized bar).
        // But for this MVP, let's keep it simple: unmount = leave.
        return () => {
            leaveVoiceChannel();
        };
    }, [channelId]);

    const handleDisconnect = () => {
        leaveVoiceChannel();
        onClose(); // Switch view back to text or null
    };

    return (
        <div className="voice-channel-container">
            <div className="voice-header">
                <button
                    className="control-btn mobile-only"
                    onClick={onClose}
                    style={{ position: 'absolute', left: '16px', top: '16px', width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <ChevronLeft size={20} />
                </button>
                <h3 style={{ marginLeft: '40px' }}>🔊 {channelName}</h3>
                <div className="voice-status">Connected • {peers.length + 1} Users</div>
            </div>

            <div className="voice-grid">
                {/* Local User */}
                {localStream && (
                    <VideoPlayer
                        stream={localStream}
                        isLocal={true}
                        username="You"
                    />
                )}

                {/* Remote Peers */}
                {peers.map((p) => (
                    <VideoPlayer
                        key={p.peerId}
                        stream={p.stream}
                        username={p.userId !== 'Unknown' ? p.userId : `User ${p.peerId.substr(0, 4)}`}
                    />
                ))}
            </div>

            <div className="voice-controls-bar">
                <button
                    className={`control-btn ${isMuted ? 'danger' : ''}`}
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    className={`control-btn ${!isVideoEnabled ? 'danger' : ''}`}
                    onClick={toggleVideo}
                    title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
                >
                    {!isVideoEnabled ? <VideoOff size={24} /> : <Video size={24} />}
                </button>

                {/* Screen Share (Future) */}
                <button className="control-btn secondary" title="Share Screen (Coming Soon)">
                    <Monitor size={24} />
                </button>

                <button
                    className="control-btn hangup-btn"
                    onClick={handleDisconnect}
                    title="Disconnect"
                >
                    <PhoneOff size={28} />
                </button>
            </div>
        </div>
    );
};

export default VoiceChannel;
