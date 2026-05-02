import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, ShieldCheck, Star, Users, Music, Send, ChevronRight, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import SEO from '../components/common/SEO';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import './VerifiedApplication.css';

const VerifiedApplication = () => {
    const navigate = useNavigate();
    const user = getStoredUser();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        realName: '',
        genre: 'Pop',
        portfolioUrl: '',
        socialHandle: '',
        bio: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate API call to register verification request
        setTimeout(async () => {
            try {
                // In a real app, this would be a POST to /api/verify/apply
                setIsSuccess(true);
            } catch (err) {
                console.error("Verification application failed", err);
            } finally {
                setIsSubmitting(false);
            }
        }, 2000);
    };

    if (isSuccess) {
        return (
            <div className="verified-success-page">
                <div className="success-content animate-pop-in">
                    <div className="success-badge-wrapper">
                        <BadgeCheck size={80} fill="var(--theme-primary, #8b5cf6)" color="white" />
                        <div className="success-glow" />
                    </div>
                    <h1>Application Received</h1>
                    <p>Our curation team is reviewing your profile. You'll receive a notification within 48 hours.</p>
                    <button className="back-home-btn" onClick={() => navigate('/profile')}>
                        Return to Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="verified-app-page">
            <SEO title="Verified Artist Application" description="Apply for the Stride Blue Checkmark." />
            <PageHeader title="Artist Verification" />

            <div className="verified-container">
                <div className="benefits-sidebar animate-slide-in-left">
                    <h3>Verified Benefits</h3>
                    <div className="benefit-item">
                        <BadgeCheck size={20} className="benefit-icon" />
                        <div>
                            <h4>Priority Discovery</h4>
                            <p>Appear higher in search results and the Rhythm hub.</p>
                        </div>
                    </div>
                    <div className="benefit-item">
                        <Star size={20} className="benefit-icon" />
                        <div>
                            <h4>Exclusive Frames</h4>
                            <p>Unlock the 'Verified Blue' profile frame automatically.</p>
                        </div>
                    </div>
                    <div className="benefit-item">
                        <Users size={20} className="benefit-icon" />
                        <div>
                            <h4>Early Access</h4>
                            <p>Beta access to new creator tools and analytics.</p>
                        </div>
                    </div>
                </div>

                <div className="app-form-card glass-panel animate-slide-in-right">
                    <div className="step-indicator">
                        <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
                        <div className="step-line" />
                        <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
                        <div className="step-line" />
                        <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
                    </div>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="form-step animate-fade-in">
                                <h2>Identity & Presence</h2>
                                <p>Tell us who you are in the real world.</p>
                                <div className="form-group">
                                    <label>Real Name / Stage Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. DJ Stride" 
                                        value={formData.realName}
                                        onChange={e => setFormData({...formData, realName: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Primary Genre</label>
                                    <select 
                                        value={formData.genre}
                                        onChange={e => setFormData({...formData, genre: e.target.value})}
                                    >
                                        <option>Pop</option>
                                        <option>Hip Hop</option>
                                        <option>Electronic</option>
                                        <option>Lo-Fi</option>
                                        <option>Rock</option>
                                    </select>
                                </div>
                                <button type="button" className="step-next-btn" onClick={handleNext}>
                                    Next Step <ChevronRight size={18} />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="form-step animate-fade-in">
                                <h2>Proof of Craft</h2>
                                <p>Show us where your music lives.</p>
                                <div className="form-group">
                                    <label>Portfolio / Spotify / SoundCloud URL</label>
                                    <input 
                                        type="url" 
                                        required 
                                        placeholder="https://spotify.com/artist/..." 
                                        value={formData.portfolioUrl}
                                        onChange={e => setFormData({...formData, portfolioUrl: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Instagram / Twitter Handle</label>
                                    <input 
                                        type="text" 
                                        placeholder="@handle" 
                                        value={formData.socialHandle}
                                        onChange={e => setFormData({...formData, socialHandle: e.target.value})}
                                    />
                                </div>
                                <div className="step-actions">
                                    <button type="button" className="step-back-btn" onClick={handleBack}>Back</button>
                                    <button type="button" className="step-next-btn" onClick={handleNext}>
                                        Next Step <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="form-step animate-fade-in">
                                <h2>Final Statement</h2>
                                <p>Why should you be a Verified Stride Artist?</p>
                                <div className="form-group">
                                    <label>Brief Pitch</label>
                                    <textarea 
                                        required 
                                        placeholder="Tell us about your musical journey..."
                                        rows={4}
                                        value={formData.bio}
                                        onChange={e => setFormData({...formData, bio: e.target.value})}
                                    />
                                </div>
                                <div className="step-actions">
                                    <button type="button" className="step-back-btn" onClick={handleBack}>Back</button>
                                    <button type="submit" className="step-submit-btn" disabled={isSubmitting}>
                                        {isSubmitting ? <div className="spinner" /> : (
                                            <>Submit Application <Send size={18} /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifiedApplication;
