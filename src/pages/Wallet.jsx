import { useState, useEffect, useCallback } from 'react';
import SEO from '../components/common/SEO';
import PageHeader from '../components/layout/PageHeader';
import { CreditCard, History, ArrowUpRight, ArrowDownLeft, Plus, DollarSign, Wallet as WalletIcon } from 'lucide-react';
import { useUI } from '../hooks/useUI';
import './Wallet.css';

const Wallet = () => {
    const { addNotification } = useUI();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTopUp, setShowTopUp] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(100);

    const username = localStorage.getItem('stride_user_username') || 'puru';

    const fetchBalance = useCallback(async () => {
        try {
            const res = await fetch('/api/wallet/balance', {
                headers: { 'x-user-username': username }
            });
            const data = await res.json();
            setBalance(data.balance);
            setTransactions(data.transactions || []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch balance:", error);
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    const handleTopUp = async () => {
        try {
            const res = await fetch('/api/wallet/topup', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-username': username
                },
                body: JSON.stringify({ amount: parseInt(topUpAmount) })
            });
            const data = await res.json();
            if (data.success) {
                setBalance(data.balance);
                setTransactions([data.transaction, ...transactions]);
                setShowTopUp(false);
                addNotification({ title: 'Top-up Successful', message: `Added ${topUpAmount} credits to your wallet.`, type: 'success' });
            }
        } catch (err) {
            addNotification({ title: 'Top-up Failed', message: 'Something went wrong.', type: 'error' });
        }
    };

    if (loading) return <div className="loading-state">Loading your vibes...</div>;

    return (
        <div className="wallet-page">
            <SEO title="My Wallet" description="Manage your Stride credits and support your favorite creators." />
            <PageHeader title="Wallet" />

            <div className="wallet-content">
                {/* Balance Card */}
                <div className="balance-card animate-scale-in">
                    <div className="balance-info">
                        <span className="balance-label">Current Balance</span>
                        <h2 className="balance-amount">
                            <DollarSign size={32} /> {balance.toLocaleString()}
                        </h2>
                    </div>
                    <button className="topup-trigger-btn" onClick={() => setShowTopUp(true)}>
                        <Plus size={20} /> Top Up
                    </button>
                    <div className="card-pattern"></div>
                </div>

                {/* Quick Stats */}
                <div className="wallet-stats">
                    <div className="stat-box">
                        <ArrowDownLeft className="text-emerald-400" />
                        <div>
                            <span>Total Earned</span>
                            <h4>0</h4>
                        </div>
                    </div>
                    <div className="stat-box">
                        <ArrowUpRight className="text-rose-400" />
                        <div>
                            <span>Total Spent</span>
                            <h4>{transactions.filter(t => t.type === 'tip' && t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0)}</h4>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <section className="transaction-section">
                    <div className="section-header">
                        <h3><History size={20} /> History</h3>
                    </div>
                    <div className="transaction-list">
                        {transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <div key={tx._id} className="transaction-item">
                                    <div className={`tx-icon ${tx.type}`}>
                                        {tx.type === 'topup' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div className="tx-info">
                                        <span className="tx-desc">{tx.description}</span>
                                        <span className="tx-date">{new Date(tx.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-history">
                                <WalletIcon size={48} />
                                <p>No transactions yet. Start vibing!</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Top-up Modal */}
            {showTopUp && (
                <div className="wallet-modal-overlay" onClick={() => setShowTopUp(false)}>
                    <div className="wallet-modal animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h3>Add Credits</h3>
                        <p>Purchase Stride credits to tip creators and unlock premium features.</p>
                        
                        <div className="amount-options">
                            {[100, 500, 1000, 5000].map(amt => (
                                <button 
                                    key={amt} 
                                    className={`amount-btn ${topUpAmount === amt ? 'active' : ''}`}
                                    onClick={() => setTopUpAmount(amt)}
                                >
                                    {amt}
                                </button>
                            ))}
                        </div>

                        <div className="custom-amount">
                            <label>Custom Amount</label>
                            <input 
                                type="number" 
                                value={topUpAmount} 
                                onChange={(e) => setTopUpAmount(e.target.value)}
                            />
                        </div>

                        <button className="confirm-topup-btn" onClick={handleTopUp}>
                            Confirm Payment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
