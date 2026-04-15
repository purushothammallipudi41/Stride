import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Wallet as WalletIcon, Plus, ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import { useUI } from '../hooks/useUI';
import { BASE_URL } from '../utils/api';
import SEO from '../components/common/SEO';
import PageHeader from '../components/layout/PageHeader';
import { getStoredUser } from '../utils/storage';
import GlobalModal from '../components/common/GlobalModal';
import './Wallet.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const Wallet = () => {
    const { addNotification } = useUI();
    const { address: evmAddress } = useAccount();
    const { publicKey: solanaAddress } = useWallet();
    
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTopUp, setShowTopUp] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(100);

    const userProfile = getStoredUser();
    const username = userProfile?.username || 'guest';

    const fetchBalance = useCallback(async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/wallet/balance`, {
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
        setIsProcessing(true);
        const resScript = await loadRazorpay();

        if (!resScript) {
            addNotification({ title: 'Payment Error', message: 'Razorpay SDK failed to load. Are you online?', type: 'error' });
            setIsProcessing(false);
            return;
        }

        try {
            // 1. Create order on backend
            const orderRes = await fetch(`${BASE_URL}/api/payments/order`, {
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
                    const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
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
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        const syncWallet = async () => {
            const currentAddress = evmAddress || solanaAddress?.toBase58();
            if (currentAddress) {
                try {
                    await fetch(`${BASE_URL}/api/wallet/connect`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, walletAddress: currentAddress })
                    });
                } catch (err) {
                    console.error("Failed to sync wallet with backend:", err);
                }
            }
        };
        syncWallet();
    }, [evmAddress, solanaAddress, username]);

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
                            <DollarSign size={32} /> {(balance || 0).toLocaleString()}
                        </h2>
                        {(evmAddress || solanaAddress) ? (
                            <div className="web3-badge animate-fade-in">
                                <WalletIcon size={12} /> {evmAddress ? `${evmAddress.substring(0, 6)}...${evmAddress.substring(38)}` : `${solanaAddress.toBase58().substring(0, 4)}...${solanaAddress.toBase58().substring(40)}`}
                            </div>
                        ) : (
                            <div className="wallet-connect-group">
                                <ConnectButton label="Connect Polygon" />
                                <WalletMultiButton className="solana-connect-btn" />
                            </div>
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
                                        {tx.amount > 0 ? '+' : ''}{(tx.amount || 0).toLocaleString()}
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

            <GlobalModal 
                isOpen={showTopUp} 
                onClose={() => setShowTopUp(false)}
                title="Add Credits"
                maxWidth="480px"
                className="wallet-topup-standardized"
            >
                <div className="wallet-modal-content">
                    <p className="modal-description">Purchase Stride credits to tip creators and unlock premium features.</p>
                    
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

                    <button 
                        className="confirm-topup-btn text-gradient-bg" 
                        onClick={handleTopUp} 
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Confirm Payment'}
                    </button>
                </div>
            </GlobalModal>
        </div>
    );
};

export default Wallet;
