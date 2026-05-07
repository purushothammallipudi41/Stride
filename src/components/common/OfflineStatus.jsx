import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';
import './OfflineStatus.css';

const OfflineStatus = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setIsDismissed(false);
        };
        const handleOffline = () => {
            setIsOffline(true);
            setIsDismissed(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline || isDismissed) return null;

    return (
        <div className="offline-status-banner glass-panel animate-slide-down">
            <div className="offline-content">
                <div className="offline-icon-pulse">
                    <WifiOff size={20} />
                </div>
                <div className="offline-text">
                    <h3>Connection Frequency Lost</h3>
                    <p>You're currently offline. Vyx is serving cached frequencys until you're back.</p>
                </div>
            </div>
            
            <div className="offline-actions">
                <button className="reconnect-btn" onClick={() => window.location.reload()}>
                    <RefreshCw size={14} /> Retry Sync
                </button>
                <button className="dismiss-offline-btn" onClick={() => setIsDismissed(true)}>
                    <X size={16} />
                </button>
            </div>
            
            <div className="offline-glow"></div>
        </div>
    );
};

export default OfflineStatus;
