import { useState } from 'react';
import { X, Gem, Zap, Star, ShieldCheck } from 'lucide-react';
import './SubscriptionModal.css';

const TIERS = [
    { name: 'SilverVibe', level: 1, price: 100, icon: <Zap size={20} />, color: '#cd7f32', perks: ['Ad-free experience', 'Subscriber badge'] },
    { name: 'GoldVibe', level: 2, price: 250, icon: <Star size={20} />, color: '#ffd700', perks: ['All Silver perks', 'Exclusive Content Access', 'Priority comments'] },
    { name: 'DiamondVibe', level: 3, price: 500, icon: <Gem size={20} />, color: '#00ffff', perks: ['All Gold perks', 'Direct Messaging', 'Custom Profile Theme'] }
];

const SubscriptionModal = ({ creator, onClose, onSubscribe }) => {
    const [selectedTier, setSelectedTier] = useState(TIERS[1]); // Default Gold
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        // Simulate/Implement real subscribe call here if needed
        // For Phase 1, we pass back to Profile parent
        await onSubscribe(selectedTier);
        setLoading(false);
    };

    return (
        <div className="sub-modal-overlay" onClick={onClose}>
            <div className="sub-modal glass-card animate-in" onClick={e => e.stopPropagation()}>
                <button className="sub-close-btn" onClick={onClose}><X size={20} /></button>

                <div className="sub-header">
                    <div className="creator-mini-info">
                        <img src={creator.avatar} alt="" />
                        <div>
                            <h2>Support @{creator.username}</h2>
                            <p>Unlock exclusive perks and content</p>
                        </div>
                    </div>
                </div>

                <div className="tiers-container">
                    {TIERS.map(tier => (
                        <div
                            key={tier.level}
                            className={`tier-card ${selectedTier.level === tier.level ? 'selected' : ''}`}
                            onClick={() => setSelectedTier(tier)}
                            style={{ '--tier-color': tier.color }}
                        >
                            <div className="tier-icon">{tier.icon}</div>
                            <h3>{tier.name}</h3>
                            <div className="tier-price">{tier.price} 🪙<span>/mo</span></div>
                            <ul className="perks-list">
                                {tier.perks.map((perk, i) => (
                                    <li key={i}><ShieldCheck size={12} /> {perk}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <button
                    className="subscribe-confirm-btn gradient-btn"
                    disabled={loading}
                    onClick={handleSubscribe}
                >
                    {loading ? 'Processing...' : `Subscribe to ${selectedTier.name} 🚀`}
                </button>
                <p className="sub-disclaimer">Cancel anytime. Tokens are deducted monthly.</p>
            </div>
        </div>
    );
};

export default SubscriptionModal;
