import React, { useState } from 'react';
import { X, Send, HelpCircle, Bug, MessageSquare, Shield } from 'lucide-react';
import { BASE_URL } from '../../utils/api';
import { getStoredUser } from '../../utils/storage';
import './SupportModal.css';

const SupportModal = ({ isOpen, onClose }) => {
    const user = getStoredUser();
    const [type, setType] = useState('feedback');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const res = await fetch(`${BASE_URL}/api/support/report`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-username': user?.username || 'anonymous'
                },
                body: JSON.stringify({ type, message, contactEmail: email })
            });
            const data = await res.json();
            if (data.success) {
                setIsSuccess(true);
                setTimeout(() => {
                    setIsSuccess(false);
                    setMessage('');
                    onClose();
                }, 3000);
            }
        } catch (err) {
            console.error("Support submission failed", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="support-modal-overlay animate-fade-in" onClick={onClose}>
            <div className="support-modal glass-panel animate-pop-in" onClick={e => e.stopPropagation()}>
                <div className="support-header">
                    <div className="support-title-wrap">
                        <HelpCircle size={24} className="support-main-icon" />
                        <div>
                            <h3>Support Hub</h3>
                            <p>How can we help you today?</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                {isSuccess ? (
                    <div className="support-success animate-fade-in">
                        <div className="success-icon-v2">✨</div>
                        <h4>Report Transmitted</h4>
                        <p>We've received your frequency. Our team will review it and get back to you if needed.</p>
                    </div>
                ) : (
                    <form className="support-form" onSubmit={handleSubmit}>
                        <div className="support-type-grid">
                            <button 
                                type="button" 
                                className={`type-btn ${type === 'bug' ? 'active' : ''}`}
                                onClick={() => setType('bug')}
                            >
                                <Bug size={18} /> <span>Bug Report</span>
                            </button>
                            <button 
                                type="button" 
                                className={`type-btn ${type === 'feedback' ? 'active' : ''}`}
                                onClick={() => setType('feedback')}
                            >
                                <MessageSquare size={18} /> <span>Feedback</span>
                            </button>
                            <button 
                                type="button" 
                                className={`type-btn ${type === 'account' ? 'active' : ''}`}
                                onClick={() => setType('account')}
                            >
                                <Shield size={18} /> <span>Account</span>
                            </button>
                        </div>

                        <div className="support-group">
                            <label>Your Message</label>
                            <textarea 
                                required 
                                placeholder="Describe the issue or your suggestion..."
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="support-group">
                            <label>Contact Email (Optional)</label>
                            <input 
                                type="email" 
                                placeholder="Where should we reach you?"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="support-submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? <div className="spinner" /> : (
                                <>Send to Stride Team <Send size={18} /></>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SupportModal;
