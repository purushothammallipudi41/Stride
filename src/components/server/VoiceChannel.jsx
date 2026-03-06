import React, { useEffect, useRef, useState } from 'react';
import { useVoice } from '../../context/VoiceContext';
import { useSocket } from '../../context/SocketContext';
import { useMusic } from '../../context/MusicContext';
import { useAuth } from '../../context/AuthContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, ChevronLeft, Volume2, Radio, Play, Pause, SkipForward, Type, Languages } from 'lucide-react';
import './VoiceChannel.css';

const useSpeakingIndicator = (stream) => {
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (!stream) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let requestRef;
        const checkVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            const volume = dataArray.reduce((p, c) => p + c, 0) / bufferLength;
            setIsSpeaking(volume > 20); // Threshold for speaking
            requestRef = requestAnimationFrame(checkVolume);
        };

        checkVolume();

        return () => {
            cancelAnimationFrame(requestRef);
            if (audioContext.state !== 'closed') audioContext.close();
        };
    }, [stream]);

    return isSpeaking;
};

const VideoPlayer = ({ stream, isLocal = false, username, avatar }) => {
    const videoRef = useRef();
    const isSpeaking = useSpeakingIndicator(stream);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className={`video-card ${isLocal ? 'local-video' : ''} ${isSpeaking ? 'speaking' : ''}`}>
            {stream?.getVideoTracks().length > 0 ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="video-element"
                />
            ) : (
                <div className="avatar-mode">
                    <div className={`avatar-circle ${isSpeaking ? 'pulse-border' : ''}`}>
                        {avatar ? <img src={avatar} alt="" /> : username?.charAt(0)}
                    </div>
                </div>
            )}
            <div className="video-overlay">
                <span className="participant-name">
                    {isSpeaking && <Volume2 size={12} className="speaking-icon" />}
                    {username || (isLocal ? 'You' : 'User')}
                </span>
            </div>
        </div>
    );
};

const ScreenSharePlayer = ({ stream, username }) => {
    const videoRef = useRef();

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="screen-share-card">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="screen-video-element"
            />
            <div className="screen-share-overlay">
                <Monitor size={14} />
                <span>{username}'s Screen</span>
            </div>
        </div>
    );
};

const CaptionsOverlay = ({ localTranscript, remoteCaptions }) => {
    if (!localTranscript && Object.keys(remoteCaptions).length === 0) return null;
    return (
        <div className="captions-overlay">
            {Object.values(remoteCaptions).map((cap, idx) => (
                <div key={idx} className="caption-entry">
                    <span className="caption-user">{cap.username}:</span>
                    <span className="caption-text">{cap.translatedText || cap.text}</span>
                    {cap.translatedText && <span className="translation-indicator">(Translated)</span>}
                </div>
            ))}
            {localTranscript && (
                <div className="caption-entry local">
                    <span className="caption-user">You:</span>
                    <span className="caption-text">{localTranscript}</span>
                </div>
            )}
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
        isListener,
        isVideoEnabled,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        voiceParticipants,
        isScreenSharing,
        screenStream,
        isTranscribing,
        transcript,
        remoteCaptions,
        toggleTranscription,
        targetLanguage,
        setTargetLanguage
    } = useVoice();
    const { socket } = useSocket();
    const { currentTrack } = useMusic();
    const { user, refreshUser } = useAuth();
    const [radioState, setRadioState] = useState(null);
    const [queue, setQueue] = useState([]);
    const radioAudioRef = useRef(new Audio());
    const visualizerRef = useRef(null);
    const [audioData, setAudioData] = useState(new Uint8Array(32));

    useEffect(() => {
        if (!socket || !channelId) return;

        socket.emit('radio-sync-request', { channelId });

        const handleRadioUpdate = (state) => {
            console.log('[RADIO] State Update:', state);
            setRadioState(state);
            if (state.queue) setQueue(state.queue);

            if (state.track && state.isPlaying) {
                const audio = radioAudioRef.current;
                if (audio.src !== state.track.audioUrl) {
                    audio.src = state.track.audioUrl;
                }

                // Sync position
                const elapsed = (Date.now() - state.startTime) / 1000;
                if (Math.abs(audio.currentTime - elapsed) > 0.5) {
                    audio.currentTime = elapsed;
                }

                audio.play().catch(e => console.error("Radio playback failed:", e));
            } else {
                radioAudioRef.current.pause();
            }
        };

        const handleQueueUpdate = (updatedQueue) => {
            setQueue(updatedQueue);
        };

        const handleBalanceUpdate = () => {
            // Trigger a refresh of the user object to update the global Vibe Token balance
            if (refreshUser && typeof refreshUser === 'function') {
                refreshUser();
            }
        };

        socket.on('radio-state-update', handleRadioUpdate);
        socket.on('radio-queue-update', handleQueueUpdate);
        socket.on('balance-update', handleBalanceUpdate);

        return () => {
            socket.off('radio-state-update', handleRadioUpdate);
            socket.off('radio-queue-update', handleQueueUpdate);
            socket.off('balance-update', handleBalanceUpdate);
            radioAudioRef.current.pause();
        };
    }, [socket, channelId]);

    // Visualizer Logic
    useEffect(() => {
        if (!radioState?.isPlaying) return;

        const audio = radioAudioRef.current;
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 64;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVisualizer = () => {
            analyser.getByteFrequencyData(dataArray);
            setAudioData(new Uint8Array(dataArray));
            requestAnimationFrame(updateVisualizer);
        };
        updateVisualizer();

        return () => audioCtx.close();
    }, [radioState?.track?.id]);

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
        radioAudioRef.current.pause();
        onClose(); // Switch view back to text or null
    };

    const toggleRadio = () => {
        if (!socket) return;
        const newState = !radioState?.isPlaying;
        socket.emit('radio-track-update', {
            channelId,
            track: radioState?.track || currentTrack,
            isPlaying: newState,
            startTime: Date.now() - (radioAudioRef.current.currentTime * 1000)
        });
    };

    const startRadioWithCurrent = () => {
        if (!currentTrack || !socket) return;
        socket.emit('radio-track-update', {
            channelId,
            track: currentTrack,
            isPlaying: true,
            startTime: Date.now()
        });
    };

    const handleBidNext = () => {
        if (!currentTrack || !socket) return;
        socket.emit('radio-queue-add', {
            channelId,
            track: currentTrack,
            bid: 50, // Static bid for now
            userEmail: user.email,
            username: user.username
        });
    };

    const handleSkip = () => {
        if (!socket) return;
        socket.emit('radio-track-skip', { channelId });
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
                {!isListener && localStream && (
                    <VideoPlayer
                        stream={localStream}
                        isLocal={true}
                        username="You"
                    />
                )}

                {/* Local Screen Share */}
                {isScreenSharing && screenStream && (
                    <ScreenSharePlayer
                        stream={screenStream}
                        username="You"
                    />
                )}

                {/* Remote Peers */}
                {peers.length === 0 && !localStream && !radioState?.track && (
                    <div className="empty-voice-grid">
                        <div className="pulse-icon"><Volume2 size={48} /></div>
                        <h3>Waiting for others to join...</h3>
                        <p>Or start a Sync Vibe session below</p>
                    </div>
                )}

                {peers.map((p) => {
                    const participantInfo = (voiceParticipants[currentChannelId] || []).find(up => up.userId === p.userId);
                    return (
                        <React.Fragment key={p.peerId}>
                            <VideoPlayer
                                stream={p.stream}
                                username={participantInfo?.username || p.userId}
                                avatar={participantInfo?.avatar}
                            />
                            {p.screenStream && (
                                <ScreenSharePlayer
                                    stream={p.screenStream}
                                    username={participantInfo?.username || p.userId}
                                />
                            )}
                        </React.Fragment>
                    );
                })}

                {radioState?.track && (
                    <div className="radio-card-sync">
                        <div className="radio-visualizer">
                            {Array.from(audioData).map((val, i) => (
                                <div
                                    key={i}
                                    className="vis-bar"
                                    style={{ height: `${(val / 255) * 100}%`, opacity: 0.5 + (val / 510) }}
                                />
                            ))}
                        </div>
                        <div className="radio-track-info">
                            <Radio size={20} className="radio-icon-live" />
                            <div className="track-details">
                                <div className="track-name">{radioState.track.title}</div>
                                <div className="track-artist">{radioState.track.artist}</div>
                            </div>
                            <button className="radio-control-btn" onClick={toggleRadio}>
                                {radioState.isPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                            <button className="radio-control-btn secondary" onClick={handleSkip} title="Next Track">
                                <SkipForward size={20} />
                            </button>
                        </div>

                        {queue.length > 0 && (
                            <div className="radio-queue-tray">
                                <div className="queue-label">UP NEXT ({queue.length})</div>
                                <div className="queue-list">
                                    {queue.map((item, qidx) => (
                                        <div key={qidx} className="queue-item">
                                            <div className="queue-item-track">
                                                <strong>{item.track.title}</strong>
                                                <span>{item.track.artist}</span>
                                            </div>
                                            <div className="queue-item-bid">
                                                <div className="bid-badge">🔥 {item.bid}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!radioState?.track && currentTrack && (
                <div className="start-radio-prompt animate-slide-up">
                    <div className="prompt-content">
                        <Radio size={20} />
                        <span>Sync <strong>{currentTrack.title}</strong> with everyone?</span>
                    </div>
                    <button className="start-radio-btn" onClick={startRadioWithCurrent}>Sync Vibe</button>
                </div>
            )}

            {radioState?.track && currentTrack && radioState.track.id !== currentTrack.id && (
                <div className="start-radio-prompt animate-slide-up" style={{ bottom: '160px' }}>
                    <div className="prompt-content">
                        <Radio size={20} />
                        <span>Bid 50 Tokens to request <strong>{currentTrack.title}</strong> next?</span>
                    </div>
                    <button className="start-radio-btn" onClick={handleBidNext}>Bid Next</button>
                </div>
            )}

            <CaptionsOverlay
                localTranscript={transcript}
                remoteCaptions={remoteCaptions}
            />

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

                <button
                    className={`control-btn ${isScreenSharing ? 'active' : 'secondary'}`}
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                >
                    <Monitor size={24} />
                </button>

                <button
                    className={`control-btn ${isTranscribing ? 'active' : 'secondary'}`}
                    onClick={toggleTranscription}
                    title={isTranscribing ? "Stop Captions" : "Live Captions"}
                >
                    <Languages size={24} />
                </button>

                {isTranscribing && (
                    <div className="language-selector-wrap">
                        <select
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            className="lang-select"
                        >
                            <option value="Original">Original</option>
                            <option value="English">English</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="German">German</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Japanese">Japanese</option>
                            <option value="Hindi">Hindi</option>
                        </select>
                    </div>
                )}

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
