import React, { useState, useEffect } from 'react';
import logo from '../../assets/vyx-logo.png';

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
        <div className={`vyx-splash-container ${isFading ? 'fade-out' : ''}`}>
            <div className="splash-content">
                <div className="splash-logo-pulse">
                    <img src={logo} alt="Vyx Logo" className="splash-logo-image animate-pulse-glow" />
                </div>
                <h1 className="splash-title">VYX</h1>
                <p className="splash-tagline">EXPERIENCE THE FREQUENCY.</p>
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
