import { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, Users, ArrowUpRight, Clock, ShieldCheck, ChevronLeft, CreditCard } from 'lucide-react';
import { useUI } from '../../hooks/useUI';
import { getStoredUser } from '../../utils/storage';
import { BASE_URL } from '../../utils/api';
import Avatar from '../common/Avatar';
import GlobalModal from '../common/GlobalModal';
import './VaultModal.css';

const VaultModal = () => {
    const { isVaultOpen, closeVault } = useUI();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = getStoredUser();

    const fetchVaultStats = useCallback(async () => {
        if (!user?.username) return;
        try {
            const res = await fetch(`${BASE_URL}/api/vault/stats/${user.username}`);
            const data = await res.json();
            setStats(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch vault stats:", err);
            setLoading(false);
        }
    }, [user?.username]);

    useEffect(() => {
        if (isVaultOpen) {
            const timer = setTimeout(() => fetchVaultStats(), 0);
            return () => clearTimeout(timer);
        }
    }, [isVaultOpen, fetchVaultStats]);

    if (!isVaultOpen) return null;

    return (
        <GlobalModal 
            isOpen={isVaultOpen} 
            onClose={closeVault}
            maxWidth="600px"
            className="vault-standardized"
        >
            <div className="vault-header">
                <button className="vault-back-btn" onClick={closeVault}>
                    <ChevronLeft size={24} />
                </button>
                <div className="header-info">
                    <h1 className="vault-title">Creator <span className="text-gradient">Vault</span></h1>
                    <p>Manage your rhythm economy</p>
                </div>
                <ShieldCheck size={28} className="vault-secure-icon" />
            </div>

            {loading ? (
                <div className="vault-loading">
                    <div className="loading-shimmer-v2"></div>
                </div>
            ) : (
                <div className="vault-content animate-fade-in">
                    {/* Main Balance Card */}
                    <div className="balance-hero-card glass-card">
                        <div className="balance-info">
                            <span className="balance-label">Total Earnings</span>
                            <div className="balance-amount">
                                <span className="currency-symbol">VP</span>
                                {stats?.totalEarnings || 0}
                            </div>
                            <div className="balance-trend positive">
                                <ArrowUpRight size={14} /> {stats?.monthlyTrend || '+0%'} this month
                            </div>
                        </div>
                        <div className="balance-actions">
                            <button className="action-pill primary"><CreditCard size={16} /> Cash Out</button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="vault-stats-grid">
                        <div className="stat-card glass-panel">
                            <TrendingUp size={20} className="stat-icon purple" />
                            <div className="stat-value">{stats?.tipCount || 0}</div>
                            <div className="stat-label">Total Tips Received</div>
                        </div>
                        <div className="stat-card glass-panel">
                            <Users size={20} className="stat-icon blue" />
                            <div className="stat-value">{stats?.topTippers?.length || 0}</div>
                            <div className="stat-label">Active Supporters</div>
                        </div>
                    </div>

                    {/* Top Tippers Section */}
                    {stats?.topTippers?.length > 0 && (
                        <div className="vault-section">
                            <h4 className="section-title">TOP TIPPERS</h4>
                            <div className="tippers-row">
                                {stats.topTippers.map((tipper, idx) => (
                                    <div key={tipper.username} className="tipper-chip">
                                        <Avatar src={tipper.avatar || ""} size={32} />

                                        <div className="tipper-info">
                                            <span className="tipper-name">{tipper.username}</span>
                                            <span className="tipper-total">{tipper.total} VP</span>
                                        </div>
                                        {idx === 0 && <span className="tipper-medal">🥇</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Transaction History */}
                    <div className="vault-section">
                        <div className="section-header">
                            <h4 className="section-title">RECENT TRANSACTIONS</h4>
                            <button className="view-all-link">View All</button>
                        </div>
                        <div className="transaction-list">
                            {stats?.recentTransactions?.length > 0 ? (
                                stats.recentTransactions.map(tx => (
                                    <div key={tx._id} className="transaction-item">
                                        <div className="tx-left">
                                            <div className="tx-icon-box">
                                                <Clock size={16} />
                                            </div>
                                            <div className="tx-info">
                                                <span className="tx-from">from {tx.from?.username || 'user'}</span>
                                                <span className="tx-date">{new Date(tx.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="tx-right positive">
                                            +{tx.amount} VP
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="tx-empty">No transactions found in this period.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </GlobalModal>
    );
};

export default VaultModal;
