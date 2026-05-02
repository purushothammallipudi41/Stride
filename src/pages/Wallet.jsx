import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Wallet as WalletIcon, Plus, ArrowDownLeft, ArrowUpRight, History, ShoppingBag } from 'lucide-react';
import { useUI } from '../hooks/useUI';
import { BASE_URL } from '../utils/api';
import SEO from '../components/common/SEO';
import PageHeader from '../components/layout/PageHeader';
import { getStoredUser } from '../utils/storage';
import GlobalModal from '../components/common/GlobalModal';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import socket from '../services/socket';
import MonetizationService from '../services/MonetizationService';
import './Wallet.css';

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
    const userId = userProfile?.id || userProfile?._id;

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

        const handleWalletUpdate = ({ balance: newBalance }) => {
            setBalance(newBalance);
            fetchBalance(); // Refresh transaction list
        };

        socket.on('wallet_updated', handleWalletUpdate);

        return () => {
            socket.off('wallet_updated', handleWalletUpdate);
        };
    }, [fetchBalance]);

    const handleTopUp = async () => {
        setIsProcessing(true);

        try {
            const productID = `vibe_points_${topUpAmount}`;
            
            // 1. Get offerings
            const offerings = await MonetizationService.getOfferings();
            const pkg = offerings?.availablePackages.find(p => p.product.identifier === productID);

            if (!pkg) {
                console.warn(`💎 Monetization: Product ${productID} not found in offerings.`);
                addNotification({ title: 'Store Error', message: 'This credit package is currently unavailable.', type: 'error' });
                setIsProcessing(false);
                return;
            }

            // 2. Trigger Purchase
            const purchaseResult = await MonetizationService.purchasePackage(pkg);
            
            if (purchaseResult.success) {
                const { customerInfo } = purchaseResult;
                
                // 3. Verify on Backend
                const verifyRes = await fetch(`${BASE_URL}/api/payments/google/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        purchaseToken: customerInfo.originalAppUserId,
                        productId: productID,
                        userId
                    })
                });
                
                const data = await verifyRes.json();
                
                if (data.success) {
                    setBalance(data.balance);
                    setShowTopUp(false);
                    addNotification({ title: 'Top-up Successful', message: `Added ${topUpAmount} credits via Google Play.`, type: 'success' });
                    fetchBalance(); // Refresh transactions
                } else {
                    addNotification({ title: 'Sync Failed', message: data.error || 'Unable to verify credits.', type: 'error' });
                }
            } else {
                addNotification({ title: 'Purchase Failed', message: purchaseResult.error || 'Payment cancelled.', type: 'error' });
            }
        } catch (err) {
            console.error('💎 Wallet Payment Error:', err);
            addNotification({ title: 'Store Error', message: 'Unable to communicate with Google Play.', type: 'error' });
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
                            <h4>{transactions.filter(t => ['tip', 'purchase', 'subscription'].includes(t.type) && t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0)}</h4>
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
                                        {tx.type === 'topup' ? <ArrowDownLeft size={18} /> : 
                                         tx.type === 'purchase' ? <ShoppingBag size={18} /> : <ArrowUpRight size={18} />}
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
