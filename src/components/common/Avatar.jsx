import React from 'react';
import './Avatar.css';

const Avatar = ({ src, alt, size = 40, className = '' }) => {
    // Check if src is an emoji or single/double character
    const isTextAvatar = !src || (typeof src === 'string' && !src.startsWith('http') && src.length <= 4);

    const style = {
        width: size,
        height: size,
        fontSize: size * 0.45,
    };

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

export default Avatar;
