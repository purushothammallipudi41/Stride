import { useState } from 'react';
import { Gem, X, Zap } from 'lucide-react';
import config from '../../config';
import './TipModal.css';

const TIP_PRESETS = [5, 10, 25, 50, 100];

const TipModal = ({ recipientEmail, recipientUsername, onClose, onSuccess }) => {
    const [amount, setAmount] = useState(10);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const sendTip = async () => {
        if (!amount || amount <= 0) { setError('Enter a valid amount'); return; }
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${config.API_URL}/api/creator/tip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipientEmail, amount: Number(amount), message })
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to send tip'); setLoading(false); return; }

            onSuccess?.(data.newBalance);
            setShowSuccess(true);
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (e) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tip-modal-overlay" onClick={onClose}>
            <div className="tip-modal glass-card" onClick={e => e.stopPropagation()}>
                <button className="tip-close-btn" onClick={onClose}><X size={18} /></button>

                {showSuccess ? (
                    <div className="tip-success-view animate-in">
                        <div className="success-icon-wrap">
                            <Zap size={40} />
                        </div>
                        <h2>Tokens Sent!</h2>
                        <p>You tipped <strong>{amount} 🪙</strong> to @{recipientUsername}</p>
                    </div>
                ) : (
                    <>
                        <div className="tip-header">
                            <div className="tip-icon-wrap"><Gem size={28} /></div>
                            <h2>Send Vibe Tokens</h2>
                            <p>Support <strong>@{recipientUsername}</strong>'s creative journey</p>
                        </div>

                        <div className="tip-presets">
                            {TIP_PRESETS.map(p => (
                                <button
                                    key={p}
                                    className={`tip-preset-btn ${amount === p ? 'selected' : ''}`}
                                    onClick={() => setAmount(p)}
                                >
                                    {p} 🪙
                                </button>
                            ))}
                        </div>

                        <div className="tip-custom-row">
                            <div className="custom-input-wrapper">
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Other"
                                    value={amount}
                                    onChange={e => setAmount(Number(e.target.value))}
                                    className="tip-amount-input"
                                />
                                <span className="token-suffix">🪙</span>
                            </div>
                        </div>

                        <textarea
                            className="tip-message-input"
                            placeholder="Add a message (optional)"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={2}
                        />

                        {error && <p className="tip-error">{error}</p>}

                        <button className="tip-send-btn gradient-btn" disabled={loading} onClick={sendTip}>
                            {loading ? 'Processing...' : `Confirm Tip • ${amount} 🪙`}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default TipModal;
