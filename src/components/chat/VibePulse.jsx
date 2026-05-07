import { X, Zap, Sparkles, TrendingUp } from 'lucide-react';
import './VibePulse.css';

const VibePulse = ({ pulseData, onClose }) => {
    if (!pulseData) return null;

    const { summary, highlights, vibeLevel, timestamp } = pulseData;

    return (
        <div className="vibe-pulse-overlay animate-fade-in">
            <div className="vibe-pulse-card glass-card animate-slide-up">
                <button className="close-pulse-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="pulse-card-header">
                    <div className="pulse-icon-container">
                        <Sparkles className="pulse-sparkle-icon" size={24} />
                    </div>
                    <div className="pulse-title-group">
                        <h2>Frequencyic Pulse</h2>
                        <span className="pulse-vibe-badge">Vibe: {vibeLevel}</span>
                    </div>
                </div>

                <div className="pulse-card-body">
                    <div className="pulse-summary-section">
                        <p className="pulse-summary-text">{summary}</p>
                    </div>

                    <div className="pulse-highlights-section">
                        <div className="section-label">
                            <TrendingUp size={14} />
                            <span>Frequencys Detected</span>
                        </div>
                        <div className="highlights-list">
                            {highlights.map((h, i) => (
                                <div key={i} className="highlight-item">
                                    <Zap size={14} className="highlight-zap" />
                                    <span>{h}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pulse-card-footer">
                    <span className="pulse-timestamp">
                        {timestamp ? (
                            `Captured ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        ) : (
                            'Pulse Synced'
                        )}
                    </span>
                    <div className="pulse-ai-branding">
                        <Sparkles size={12} />
                        <span>Social AI Engine</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VibePulse;
