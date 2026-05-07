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
                filter: 'drop-shadow(0 0 2px rgba(0, 102, 255, 0.5))',
                flexShrink: 0,
                display: 'inline-block',
                verticalAlign: 'middle'
            }}
        >
            <defs>
                <linearGradient id="badge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0066ff" />
                    <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
            </defs>
            <path 
                d="M9.68 2.373a2.5 2.5 0 0 1 4.64 0l.334.883a2.5 2.5 0 0 0 1.942 1.631l.93.136a2.5 2.5 0 0 1 2.32 2.32l.136.93a2.5 2.5 0 0 0 1.631 1.942l.883.334a2.5 2.5 0 0 1 0 4.64l-.883.334a2.5 2.5 0 0 0-1.631 1.942l-.136.93a2.5 2.5 0 0 1-2.32 2.32l-.93.136a2.5 2.5 0 0 0-1.942 1.631l-.334.883a2.5 2.5 0 0 1-4.64 0l-.334-.883a2.5 2.5 0 0 0-1.942-1.631l-.93-.136a2.5 2.5 0 0 1-2.32-2.32l-.136-.93a2.5 2.5 0 0 0-1.631-1.942l-.883-.334a2.5 2.5 0 0 1 0-4.64l.883-.334a2.5 2.5 0 0 0 1.631-1.942l.136-.93a2.5 2.5 0 0 1 2.32-2.32l.93-.136a2.5 2.5 0 0 0 1.942-1.631l.334-.883Z" 
                fill="url(#badge-gradient)" 
            />
            <path 
                d="M8 12.5L11 15.5L17 7.5" 
                stroke="white" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
        </svg>
    );
};

export default VerificationBadge;
