import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Gift, Shield, Star, Award, Zap, Disc, MessageSquare, Music } from 'lucide-react';
import config from '../../config';
import './RewardsPanel.css';

const RewardsPanel = () => {
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    const [claiming, setClaiming] = useState(false);

    // Mock shop items
    const shopItems = [
        { id: 'neon_frame', name: 'Neon Avatar Frame', cost: 500, icon: <Shield className="item-icon neon" /> },
        { id: 'gold_name', name: 'Golden Username', cost: 1000, icon: <Star className="item-icon gold" /> },
        { id: 'gold_frame', name: 'Golden Avatar Frame', cost: 2000, icon: <Star className="item-icon gold" /> },
        { id: 'gold_bubble', name: 'Golden Chat Bubble', cost: 2000, icon: <MessageSquare className="item-icon gold" /> },
        { id: 'cyberpunk_bubbles', name: 'Cyberpunk Chat Bubbles', cost: 1500, icon: <MessageSquare className="item-icon chat-dye" /> },
        { id: 'holographic_ring', name: 'Holographic Avatar Ring', cost: 2000, icon: <Disc className="item-icon holo" /> },
        { id: 'void_theme', name: 'Void Profile Theme', cost: 3000, icon: <Award className="item-icon platinum" /> }
    ];

    const handleClaimDaily = async () => {
        if (!user) return;
        setClaiming(true);
        try {
            const targetId = user._id || user.id;
            const res = await fetch(`${config.API_URL}/api/users/${targetId}/claim-daily-vibe`, {
                method: 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                showToast(`Claimed ${data.amount} Vibe Tokens!`, 'success');
                await refreshUser();
            } else {
                const err = await res.json();
                showToast(err.error || 'Failed to claim', 'error');
            }
        } catch (e) {
            showToast('Network error while claiming', 'error');
        } finally {
            setClaiming(false);
        }
    };

    const handlePurchase = async (item) => {
        if (!user) return;

        if (user.unlockedPerks?.includes(item.id)) {
            showToast(`You already own ${item.name}`, 'info');
            return;
        }

        if ((user.vibeTokens || 0) < item.cost) {
            showToast(`Not enough tokens for ${item.name}`, 'error');
            return;
        }

        try {
            const targetId = user._id || user.id;
            const res = await fetch(`${config.API_URL}/api/users/${targetId}/purchase-perk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ perkId: item.id, cost: item.cost })
            });

            if (res.ok) {
                showToast(`Unlocked ${item.name}!`, 'success');
                await refreshUser();
            } else {
                const err = await res.json();
                showToast(err.error || 'Failed to purchase', 'error');
            }
        } catch (e) {
            showToast('Network error during purchase', 'error');
        }
    };

    return (
        <div className="rewards-panel-container animate-fade-in">
            {/* Tokens Balance Header */}
            <div className="rewards-header glass-card">
                <div className="balance-info">
                    <span className="balance-label">Your Balance</span>
                    <div className="balance-amount">
                        <Sparkles size={28} className="token-icon pulse" />
                        <h2>{user?.vibeTokens || 0} <span className="vt-text">VT</span></h2>
                    </div>
                </div>
                <button
                    className="claim-btn primary-btn"
                    onClick={handleClaimDaily}
                    disabled={claiming}
                >
                    {claiming ? 'Claiming...' : (
                        <>
                            <Gift size={18} /> Daily Claim (+50)
                        </>
                    )}
                </button>
            </div>

            {/* Vibe Shop */}
            <div className="vibe-shop-section">
                <h3 className="section-title"><Zap size={20} /> The Vibe Shop</h3>
                <div className="shop-grid">
                    {shopItems.map(item => (
                        <div key={item.id} className="shop-item glass-card hover-lift">
                            <div className="item-icon-wrapper">
                                {item.icon}
                            </div>
                            <div className="item-details">
                                <h4>{item.name}</h4>
                                <p className="item-cost">
                                    <Sparkles size={14} /> {item.cost} VT
                                </p>
                            </div>
                            <button
                                className={`purchase-btn ${user?.unlockedPerks?.includes(item.id) ? 'owned-btn' : 'secondary-btn'}`}
                                onClick={() => handlePurchase(item)}
                                disabled={user?.unlockedPerks?.includes(item.id)}
                            >
                                {user?.unlockedPerks?.includes(item.id) ? 'Owned' : 'Unlock'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Achievements Log */}
            <div className="achievements-section glass-card">
                <h3 className="section-title"><Award size={20} /> Recent Achievements</h3>
                <div className="achievements-list">
                    {/* Placeholder content for now */}
                    <div className="achievement-row">
                        <div className="achievement-icon new-user"><Star size={16} /></div>
                        <div className="achievement-text">Joined Stride 2.0</div>
                        <div className="achievement-reward">+100 VT</div>
                    </div>
                    <div className="achievement-row">
                        <div className="achievement-icon socially-active"><Award size={16} /></div>
                        <div className="achievement-text">Make 5 Posts</div>
                        <div className="achievement-reward">+50 VT</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RewardsPanel;
