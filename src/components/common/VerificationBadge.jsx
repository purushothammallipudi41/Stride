import React from 'react';
import { Check } from 'lucide-react';

const VerificationBadge = ({ size = 16 }) => {
    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size,
            height: size,
            backgroundColor: '#8b5cf6', // Premium Purple
            borderRadius: '50%',
            flexShrink: 0
        }}>
            <Check size={size * 0.75} color="white" strokeWidth={4} />
        </div>
    );
};

export default VerificationBadge;
