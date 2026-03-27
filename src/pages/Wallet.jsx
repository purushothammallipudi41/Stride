import { useState, useEffect, useCallback } from 'react';
import SEO from '../components/common/SEO';
import PageHeader from '../components/layout/PageHeader';
import { DollarSign, Plus, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, History } from 'lucide-react';
import { useUI } from '../hooks/useUI';
import './Wallet.css';

const Wallet = () => {
    const { addNotification } = useUI();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTopUp, setShowTopUp] = useState(false);
    const [walletAddress, setWalletAddress] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(100);

    const username = localStorage.getItem('stride_user_username') || 'puru';

    const fetchBalance = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/wallet/balance`, {
                headers: { 'x-user-username': username }
            });
            const data = await res.json();
            setBalance(data.balance);
            setTransactions(data.transactions || []);
            setWalletAddress(data.walletAddress);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch balance:", error);
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleTopUp = async () => {
        setIsConnecting(true);
        const resScript = await loadRazorpay();

        if (!resScript) {
            addNotification({ title: 'Payment Error', message: 'Razorpay SDK failed to load. Are you online?', type: 'error' });
            setIsConnecting(false);
            return;
        }

        try {
            // 1. Create order on backend
            const orderRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/payments/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseInt(topUpAmount), username })
            });
            const { order } = await orderRes.json();

            // 2. Open Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                amount: order.amount,
                currency: order.currency,
                name: 'Stride Credits',
                description: `Top up ${topUpAmount} VP`,
                order_id: order.id,
                handler: async (response) => {
                    // 3. Verify on backend
                    const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/payments/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...response,
                            username,
                            amount: topUpAmount
                        })
                    });
                    const data = await verifyRes.json();
                    if (data.success) {
                        setBalance(data.balance);
                        setTransactions([data.transaction, ...transactions]);
                        setShowTopUp(false);
                        addNotification({ title: 'Top-up Successful', message: `Added ${topUpAmount} credits to your wallet.`, type: 'success' });
                    }
                },
                prefill: {
                    name: username,
                    email: `${username}@stride.social`
                },
                theme: { color: '#8b5cf6' }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (err) {
            console.error('Payment Error:', err);
            addNotification({ title: 'Top-up Failed', message: 'Unable to initiate payment.', type: 'error' });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleConnectWallet = async () => {
        setIsConnecting(true);
        try {
            // Mock Web3 connection
            await new Promise(r => setTimeout(r, 1500));
            const mockAddress = `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
            
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/wallet/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, walletAddress: mockAddress })
            });
            const data = await res.json();
            if (data.success) {
                setWalletAddress(mockAddress);
                addNotification({ title: 'Wallet Connected', message: 'Your Web3 identity is now linked to Stride.', type: 'success' });
            }
        } catch {
            addNotification({ title: 'Connection Failed', message: 'Unable to connect to Web3 provider.', type: 'error' });
        } finally {
            setIsConnecting(false);
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
                        {walletAddress ? (
                            <div className="web3-badge animate-fade-in">
                                <WalletIcon size={12} /> {`${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`}
                            </div>
                        ) : (
                            <button className="connect-wallet-btn" onClick={handleConnectWallet} disabled={isConnecting}>
                                {isConnecting ? 'Linking...' : 'Connect Web3 Wallet'}
                            </button>
                        )}
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
