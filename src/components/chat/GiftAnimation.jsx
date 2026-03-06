import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Rocket, Gem, Heart, Trophy } from 'lucide-react';
import './GiftAnimation.css';

// Mock Lottie URLs (In real world, provide actual JSON assets)
const ANIMATIONS = {
    rocket: 'https://assets2.lottiefiles.com/packages/lf20_qu4m7vax.json',
    diamond: 'https://assets5.lottiefiles.com/packages/lf20_m9u9u8.json',
    heart: 'https://assets1.lottiefiles.com/packages/lf20_7ghvscu8.json',
    trophy: 'https://assets9.lottiefiles.com/packages/lf20_9n6scd.json'
};

const GiftAnimation = ({ type, sender, recipient, onComplete }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onComplete?.();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div className={`gift-overlay-animation ${type}`}>
            <div className="gift-content-wrap">
                <div className="gift-lottie-container">
                    {/* Fallback to Lucide if Lottie link fails or while loading */}
                    <div className="gift-fallback-icon">
                        {type === 'rocket' && <Rocket size={80} />}
                        {type === 'diamond' && <Gem size={80} />}
                        {type === 'heart' && <Heart size={80} />}
                        {type === 'trophy' && <Trophy size={80} />}
                    </div>
                </div>
                <div className="gift-shoutout glass-card">
                    <span className="sender">{sender}</span>
                    <span className="text">gifted a {type} to</span>
                    <span className="recipient">{recipient}</span>
                </div>
            </div>
        </div>
    );
};

export default GiftAnimation;
