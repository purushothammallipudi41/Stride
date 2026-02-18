import React from 'react';
import { Mic, MicOff, User } from 'lucide-react';

const VideoTile = ({ stream, isMuted, username, isLocal, avatar }) => {
    const videoRef = React.useRef(null);

    React.useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="video-tile" style={{
            position: 'relative',
            background: '#202225',
            borderRadius: '12px',
            overflow: 'hidden',
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal} // Mute local video to prevent echo
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Fallback for no video or audio-only */}
            {(!stream || !stream.getVideoTracks().length || !stream.getVideoTracks()[0].enabled) && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2f3136' }}>
                    {avatar ?
                        <img src={avatar} alt={username} style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                        : <User size={48} color="#ccc" />
                    }
                </div>
            )}

            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 8px',
                borderRadius: '4px',
                color: 'white',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                {isMuted ? <MicOff size={14} color="#f23f43" /> : <Mic size={14} />}
                <span>{username} {isLocal && '(You)'}</span>
            </div>
        </div>
    );
};

export default VideoTile;
