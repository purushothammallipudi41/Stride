import React from 'react';

const VerificationBadge = ({ size = 16 }) => {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
                filter: 'drop-shadow(0 0 2px rgba(139, 92, 246, 0.5))',
                flexShrink: 0,
                display: 'inline-block',
                verticalAlign: 'middle'
            }}
        >
            <defs>
                <linearGradient id="badge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="11" fill="url(#badge-gradient)" />
            <path 
                d="M7 12.5L10 15.5L17 8.5" 
                stroke="white" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
        </svg>
    );
};

export default VerificationBadge;
