import React from 'react';
import { Music } from 'lucide-react';
import VerificationBadge from './VerificationBadge';
import './Avatar.css';

const Avatar = ({ src, alt, size = 40, className = '', frame = 'none', isListening = false, isVerified = false, isPremium = false }) => {
    // Check if src is an emoji or single/double character
    const isTextAvatar = !src || (typeof src === 'string' && !src.startsWith('http') && src.length <= 4);

    // Monetization Logic: Downgrade premium frames if user is not premium
    let activeFrame = frame;
    if (!isPremium && (frame === 'neon' || frame === 'holographic')) {
        activeFrame = 'gold'; // Downgrade to gold (or could be 'none')
    }

    const style = {
        width: size,
        height: size,
        fontSize: size * 0.45,
    };
    
    // ... rest of the code updated to use activeFrame

    const renderContent = () => {
        if (isTextAvatar) {
            return (
                <div 
                    className={`smart-avatar-text ${className}`} 
                    style={style}
                    aria-label={alt}
                >
                    {src || (alt ? alt.charAt(0).toUpperCase() : '?')}
                </div>
            );
        }

        return (
            <img 
                src={src} 
                alt={alt} 
                className={`smart-avatar-img ${className}`}
                style={{ width: size, height: size }}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                }}
            />
        );
    };

    const badgeSize = Math.max(12, size * 0.3);

    const badgeOverlay = isVerified && (
        <div className="avatar-verification-overlay" style={{ 
            position: 'absolute', 
            bottom: -2, 
            right: -2, 
            zIndex: 10,
            border: '2px solid #000',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex'
        }}>
            <VerificationBadge size={badgeSize} />
        </div>
    );

    if (activeFrame && activeFrame !== 'none') {
        const frameClass = `avatar-frame-${activeFrame}`;
        return (
            <div className={`avatar-frame-container ${frameClass}`} style={{ width: size + 6, height: size + 6, position: 'relative' }}>
                {renderContent()}
                {badgeOverlay}
                {isListening && (
                    <div className="listening-indicator">
                        <Music size={size * 0.3} className="music-icon-pulse" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="avatar-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
            {renderContent()}
            {badgeOverlay}
            {isListening && (
                <div className="listening-indicator no-frame">
                    <Music size={size * 0.3} className="music-icon-pulse" />
                </div>
            )}
        </div>
    );
};

export default Avatar;
