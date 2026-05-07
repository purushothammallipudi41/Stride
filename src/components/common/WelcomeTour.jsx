import React, { useState, useEffect } from 'react';
import { Zap, Music, Users, Sparkles, ChevronRight, X } from 'lucide-react';
import './WelcomeTour.css';

const WelcomeTour = () => {
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('vyx_seen_tour');
        if (!hasSeenTour) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('vyx_seen_tour', 'true');
    };

    if (!isVisible) return null;

    const tourSteps = [
        {
            icon: <Music size={40} color="var(--theme-primary, #0066ff)" />,
            title: "Your Daily Frequency",
            desc: "Discover fresh beats and follow your favorite artists in real-time."
        },
        {
            icon: <Zap size={40} color="#f59e0b" />,
            title: "Interactive Stages",
            desc: "Join live Vibe-Sync sessions and connect physically with the community."
        },
        {
            icon: <Sparkles size={40} color="#ec4899" />,
            title: "Pro Creator Tools",
            desc: "Unlock analytics, exclusive frames, and start your journey as a Vyx Artist."
        }
    ];

    return (
        <div className="tour-overlay animate-fade-in">
            <div className="tour-card glass-panel animate-pop-in">
                <button className="tour-skip" onClick={handleComplete}><X size={20} /></button>
                
                <div className="tour-content">
                    <div className="tour-icon-wrap animate-bounce-slow">
                        {tourSteps[step].icon}
                    </div>
                    <h2>{tourSteps[step].title}</h2>
                    <p>{tourSteps[step].desc}</p>
                </div>

                <div className="tour-footer">
                    <div className="tour-dots">
                        {tourSteps.map((_, i) => (
                            <div key={i} className={`tour-dot ${i === step ? 'active' : ''}`} />
                        ))}
                    </div>
                    <button className="tour-next-btn" onClick={handleNext}>
                        {step === 2 ? "Let's Go!" : "Continue"} <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeTour;
