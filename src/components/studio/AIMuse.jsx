import { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Hash, Zap, Clock, Info, CheckCircle, ChevronRight, X } from 'lucide-react';
import { BASE_URL } from '../../utils/api';
import './AIMuse.css';

const AIMuse = ({ filterId, mode, onClose }) => {
    const [suggestions, setSuggestions] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('captions');
    const [appliedTags, setAppliedTags] = useState(new Set());

    useEffect(() => {
        const fetchMuseData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${BASE_URL}/api/studio/muse/suggest?filterId=${filterId}&mode=${mode}`);
                const data = await res.json();
                setSuggestions(data);
            } catch (err) {
                console.error("Muse failed to speak:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMuseData();
    }, [filterId, mode]);

    const toggleTag = (tag) => {
        setAppliedTags(prev => {
            const next = new Set(prev);
            if (next.has(tag)) next.delete(tag);
            else next.add(tag);
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="ai-muse-drawer loading">
                <div className="muse-core-pulse">
                    <Sparkles size={40} className="muse-core-icon" />
                </div>
                <h3>Consulting the Muse...</h3>
                <p>Analyzing rhythmic intent and platform pulses.</p>
            </div>
        );
    }

    return (
        <div className="ai-muse-drawer animate-slide-in-right">
            <header className="muse-header">
                <div className="muse-branding">
                    <Sparkles size={20} className="muse-sparkle-glow" />
                    <span>AI MUSE v2.9</span>
                </div>
                <button className="muse-close" onClick={onClose}><X size={18} /></button>
            </header>

            <div className="muse-forecast-card">
                <div className="forecast-main">
                    <div className="vibe-gauge-wrap">
                        <svg className="vibe-gauge-svg" viewBox="0 0 100 100">
                            <circle className="gauge-bg" cx="50" cy="50" r="45" />
                            <circle 
                                className="gauge-fill" 
                                cx="50" cy="50" r="45" 
                                style={{ strokeDashoffset: 282 - (282 * (suggestions?.vibeScore || 0)) / 100 }}
                            />
                        </svg>
                        <div className="vibe-score-label">
                            <span className="vibe-val">{suggestions?.vibeScore}</span>
                            <span className="vibe-unit">% VIBE</span>
                        </div>
                    </div>
                    <div className="forecast-meta">
                        <h4>Trend Forecast</h4>
                        <div className="forecast-indicator">
                            <Zap size={14} className="text-primary" /> High Potential
                        </div>
                    </div>
                </div>
                <div className="peak-time-banner">
                    <Clock size={14} /> Peak Engagement in <b>{suggestions?.peakTime}m</b>
                </div>
            </div>

            <nav className="muse-tabs">
                <button className={`m-tab ${activeTab === 'captions' ? 'active' : ''}`} onClick={() => setActiveTab('captions')}>
                    <MessageSquare size={16} /> Suggestions
                </button>
                <button className={`m-tab ${activeTab === 'tags' ? 'active' : ''}`} onClick={() => setActiveTab('tags')}>
                    <Hash size={16} /> Hashtags
                </button>
            </nav>

            <div className="muse-content-scroll">
                {activeTab === 'captions' && (
                    <div className="muse-captions-list animate-fade-in">
                        {suggestions?.captions.map((cap, i) => (
                            <div key={i} className="muse-suggestion-item" onClick={() => {
                                navigator.clipboard.writeText(cap);
                                alert("Caption copied to clipboard! ✍️");
                            }}>
                                <p>{cap}</p>
                                <div className="s-action">Tap to Copy</div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'tags' && (
                    <div className="muse-tags-cloud animate-fade-in">
                        {suggestions?.hashtags.map((tag, i) => (
                            <button 
                                key={i} 
                                className={`muse-tag-chip ${appliedTags.has(tag) ? 'active' : ''}`}
                                onClick={() => toggleTag(tag)}
                            >
                                {tag} {appliedTags.has(tag) && <CheckCircle size={12} />}
                            </button>
                        ))}
                        {appliedTags.size > 0 && (
                            <button className="apply-tags-btn" onClick={() => {
                                alert(`${appliedTags.size} tags copied! 🚀`);
                                onClose();
                            }}>
                                Apply Selected <ChevronRight size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <footer className="muse-footer">
                <div className="muse-intel">
                    <Info size={12} /> Suggestions tailored to <b>{filterId.toUpperCase()}</b> filter.
                </div>
            </footer>
        </div>
    );
};

export default AIMuse;
