import React from 'react';
import { Music } from 'lucide-react';
import './Avatar.css';

const Avatar = ({ src, alt, size = 40, className = '', frame = 'none', isListening = false }) => {
    // Check if src is an emoji or single/double character
    const isTextAvatar = !src || (typeof src === 'string' && !src.startsWith('http') && src.length <= 4);

    const style = {
        width: size,
        height: size,
        fontSize: size * 0.45,
    };

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

    if (frame && frame !== 'none') {
        const frameClass = `avatar-frame-${frame}`;
        return (
            <div className={`avatar-frame-container ${frameClass}`} style={{ width: size + 6, height: size + 6 }}>
                {renderContent()}
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
            {isListening && (
                <div className="listening-indicator no-frame">
                    <Music size={size * 0.3} className="music-icon-pulse" />
                </div>
            )}
        </div>
    );
};

export default Avatar;
