import { memo } from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import './UserAvatar.css';

const UserAvatar = memo(({ user, size = 'md', className = '', showOnline = false, isLive = false, isStory = false, isViewed = false, onClick }) => {
    const avatarUrl = getImageUrl(user?.avatar) || getImageUrl(user?.username, 'user');
    const activeFrame = user?.activeAvatarFrame;

    return (
        <div
            className={`user-avatar-wrapper ${size} ${className} ${isLive ? 'live' : ''} ${isStory ? 'story' : ''} ${isViewed ? 'viewed' : ''} ${activeFrame ? activeFrame.replace(/_/g, '-') : ''}`}
            onClick={onClick}
        >
            <div
                className="user-avatar-main"
                style={{ backgroundImage: `url(${avatarUrl})` }}
            >
                {!user?.avatar && !user?.username && <div className="avatar-placeholder" />}
            </div>

            {showOnline && (
                <div className={`online-indicator ${user?.isOnline ? 'online' : ''}`} />
            )}

            {activeFrame === 'holographic_ring' && <div className="holo-ring-fx" />}
            {activeFrame === 'neon_frame' && <div className="neon-frame-fx" />}
        </div>
    );
});

export default UserAvatar;
