import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsFading(true);
            setTimeout(onComplete, 800); // Wait for fade animation
        }, 2500); // Display for 2.5s
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className={`stride-splash-container ${isFading ? 'fade-out' : ''}`}>
            <div className="splash-content">
                <div className="splash-logo-pulse">
                    <div className="splash-s animate-pulse-glow">S</div>
                </div>
                <h1 className="splash-title">STRIDE</h1>
                <p className="splash-tagline">FEEL THE PULSE. HEAR THE FUTURE.</p>
            </div>
            <div className="splash-footer">
                <div className="loading-bar-container">
                    <div className="loading-bar-progress" />
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
