import React, { useState } from 'react';
import { ChevronRight, Music, Users, Video } from 'lucide-react';
import GlobalModal from './common/GlobalModal';
import './OnboardingModal.css';

const OnboardingModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Welcome to Vyx",
            description: "The next generation of music social networking. Discover, connect, and vibe in 4K.",
            icon: <div className="onboarding-icon-main">🚀</div>,
            color: "var(--theme-primary)"
        },
        {
            title: "Discover Your Sound",
            description: "Explore high-definition Reels and community-led music jukeboxes.",
            icon: <Music size={48} className="text-purple-500" />,
            color: "#00f2ff"
        },
        {
            title: "Join the Community",
            description: "Gaming hubs, production circles, and social hangouts await you.",
            icon: <Users size={48} className="text-blue-500" />,
            color: "#3b82f6"
        },
        {
            title: "Crystal Clear Quality",
            description: "Experience zero-compromise video and lossless audio sharing.",
            icon: <Video size={48} className="text-pink-500" />,
            color: "#ec4899"
        }
    ];

    if (!isOpen) return null;

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    return (
        <GlobalModal 
            isOpen={isOpen} 
            onClose={onClose} 
            showClose={true}
            maxWidth="480px"
            className="onboarding-standardized"
        >
            <div className="onboarding-content">
                <div className="onboarding-icon-container" style={{ color: steps[step].color }}>
                    {steps[step].icon}
                </div>
                
                <h2>{steps[step].title}</h2>
                <p>{steps[step].description}</p>
            </div>

            <div className="onboarding-footer">
                <div className="onboarding-dots">
                    {steps.map((_, i) => (
                        <div key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`} />
                    ))}
                </div>
                
                <button className="onboarding-next-btn" onClick={handleNext}>
                    {step === steps.length - 1 ? 'Get Started' : 'Next'}
                    <ChevronRight size={18} />
                </button>
                
                {step < steps.length - 1 && (
                    <button className="onboarding-skip" onClick={onClose}>
                        Skip
                    </button>
                )}
            </div>
        </GlobalModal>
    );
};

export default OnboardingModal;
