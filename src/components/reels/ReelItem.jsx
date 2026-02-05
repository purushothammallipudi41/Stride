import { Heart, MessageCircle, Share2, MoreHorizontal, Music2 } from 'lucide-react';
import './Reels.css';

const ReelItem = ({ reel }) => {
    return (
        <div className="reel-item">
            {/* Video Background Placeholder */}
            <div className="reel-video-bg">
                <img
                    src={reel.videoUrl}
                    alt={reel.caption}
                    loading="lazy"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0
                    }}
                />
                <div className="reel-overlay" />
            </div>

            <div className="reel-content">
                <div className="reel-info">
                    <div className="reel-user">
                        <div className="reel-avatar" />
                        <span className="reel-username">{reel.username}</span>
                        <button className="follow-btn">Follow</button>
                    </div>
                    <p className="reel-caption">{reel.caption}</p>
                    <div className="reel-music-tag">
                        <Music2 size={16} />
                        <span>{reel.musicTrack}</span>
                    </div>
                </div>
            </div>

            <div className="reel-actions">
                <button className="reel-action-btn">
                    <Heart size={28} />
                    <span>{reel.likes}</span>
                </button>
                <button className="reel-action-btn">
                    <MessageCircle size={28} />
                    <span>{reel.comments}</span>
                </button>
                <button className="reel-action-btn">
                    <Share2 size={28} />
                    <span>Share</span>
                </button>
                <button className="reel-action-btn">
                    <MoreHorizontal size={28} />
                </button>
                <div className="music-disc-anim">
                    <div className="disc-inner" />
                </div>
            </div>
        </div>
    );
};

export default ReelItem;
