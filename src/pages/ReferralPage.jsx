import { useState, useEffect } from 'react';
import { Link, Copy, Users, Zap, Check } from 'lucide-react';
import config from '../config';
import './ReferralPage.css';

const ReferralPage = () => {
    const [referral, setReferral] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchReferral = async () => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            try {
                const res = await fetch(`${config.API_URL}/api/users/referral`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) setReferral(data);
            } catch (e) {
                console.error('[ReferralPage]', e);
            } finally {
                setLoading(false);
            }
        };
        fetchReferral();
    }, []);

    const copyLink = () => {
        if (referral?.url) {
            navigator.clipboard.writeText(referral.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="referral-page">
            <div className="referral-hero">
                <div className="referral-icon-ring">
                    <Link size={36} />
                </div>
                <h1>Invite Friends, Earn Tokens</h1>
                <p>Share your referral link. When a friend joins Stride, you get <strong>50 tokens</strong> and they get <strong>25 tokens</strong>.</p>
            </div>

            {loading ? (
                <div className="referral-skeleton-wrap">
                    <div className="skeleton-block" style={{ height: 60, borderRadius: 12 }} />
                    <div className="skeleton-block" style={{ height: 80, borderRadius: 12 }} />
                </div>
            ) : referral ? (
                <>
                    <div className="referral-link-row glass-card">
                        <span className="referral-url-text">{referral.url}</span>
                        <button className="referral-copy-btn" onClick={copyLink}>
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <div className="referral-stats-grid">
                        <div className="referral-stat-card glass-card">
                            <div className="stat-icon-wrap users"><Users size={22} /></div>
                            <div className="stat-value">{referral.joinedCount}</div>
                            <div className="stat-label">Friends Joined</div>
                        </div>
                        <div className="referral-stat-card glass-card">
                            <div className="stat-icon-wrap tokens"><Zap size={22} /></div>
                            <div className="stat-value">{referral.tokensEarned}</div>
                            <div className="stat-label">Tokens Earned</div>
                        </div>
                    </div>

                    <div className="referral-how-it-works glass-card">
                        <h3>How it works</h3>
                        <div className="how-step">
                            <span className="step-num">1</span>
                            <span>Share your unique referral link with friends</span>
                        </div>
                        <div className="how-step">
                            <span className="step-num">2</span>
                            <span>Friend signs up on Stride</span>
                        </div>
                        <div className="how-step">
                            <span className="step-num">3</span>
                            <span>You get <strong>50 tokens</strong>, they get <strong>25 tokens</strong> 🎉</span>
                        </div>
                    </div>
                </>
            ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Failed to load referral link. Please try again.</p>
            )}
        </div>
    );
};

export default ReferralPage;
