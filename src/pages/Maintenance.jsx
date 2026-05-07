import React from 'react';
import { Zap, Construction, Clock, ExternalLink } from 'lucide-react';
import './Maintenance.css';

const Maintenance = () => {
    return (
        <div className="maintenance-overlay">
            <div className="maintenance-content animate-pop-in">
                <div className="maintenance-icon-wrapper">
                    <Zap size={60} fill="var(--theme-primary, #0066ff)" color="white" />
                    <div className="maintenance-pulse" />
                </div>
                
                <h1 className="glitch-text" data-text="Syncing the Frequency">Syncing the Frequency</h1>
                <p>Vyx is currently undergoing a planned frequency adjustment to improve your experience.</p>
                
                <div className="status-card glass-panel">
                    <div className="status-item">
                        <Construction size={18} className="status-icon" />
                        <span>Core Infrastructure Upgrade</span>
                    </div>
                    <div className="status-item">
                        <Clock size={18} className="status-icon" />
                        <span>Estimated Back: <strong>Soon</strong></span>
                    </div>
                </div>

                <div className="maintenance-footer">
                    <p>Follow our updates on</p>
                    <div className="social-links">
                        <a href="https://twitter.com/thevyxapp" target="_blank" rel="noreferrer" className="social-tag">
                            Twitter <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
