import React, { useState } from 'react';
import { Coins, CheckCircle2, ShieldAlert } from 'lucide-react';
import GlobalModal from '../common/GlobalModal';
import './PurchaseModal.css';

const PurchaseModal = ({ isOpen, onClose, asset, userBalance, onConfirm }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen || !asset) return null;

    const canAfford = userBalance >= asset.price;

    const handlePurchase = () => {
        if (!canAfford) return;
        setIsProcessing(true);
        
        // Simulate network/blockchain verification latency
        setTimeout(() => {
            setIsProcessing(false);
            onConfirm(asset);
        }, 1200);
    };

    return (
        <GlobalModal 
            isOpen={isOpen} 
            onClose={onClose}
            showClose={!isProcessing}
            maxWidth="400px"
        >
            <div className={`purchase-modal-content ${isProcessing ? 'processing' : ''}`}>
                <div className="purchase-header">
                    <h2>Confirm Transaction</h2>
                    <p>You are about to acquire a Premium Asset</p>
                </div>

                <div className="purchase-asset-preview glass-card">
                    <div className="asset-icon-glow">
                        <asset.icon size={48} />
                    </div>
                    <h3>@{asset.name}</h3>
                    {asset.badge && <span className="premium-badge">{asset.badge}</span>}
                </div>

                <div className="purchase-ledger">
                    <div className="ledger-row">
                        <span>Current Balance</span>
                        <div className="ledger-value">
                            <Coins size={14} /> {userBalance.toLocaleString()}
                        </div>
                    </div>
                    <div className="ledger-row deduction">
                        <span>Asset Cost</span>
                        <div className="ledger-value">
                            -<Coins size={14} /> {asset.price.toLocaleString()}
                        </div>
                    </div>
                    <div className="ledger-divider" />
                    <div className="ledger-row">
                        <span>Remaining Balance</span>
                        <div className={`ledger-value ${!canAfford ? 'insufficient' : ''}`}>
                            <Coins size={14} /> {(userBalance - asset.price).toLocaleString()}
                        </div>
                    </div>
                </div>

                {isProcessing ? (
                    <button className="confirm-btn processing" disabled>
                        <div className="minting-loader" /> Minting Asset...
                    </button>
                ) : canAfford ? (
                    <button className="confirm-btn active text-gradient-bg" onClick={handlePurchase}>
                        Confirm Purchase
                    </button>
                ) : (
                    <button className="confirm-btn locked" disabled>
                        <ShieldAlert size={16} /> Insufficient Vibe Tokens
                    </button>
                )}
            </div>
        </GlobalModal>
    );
};

export default PurchaseModal;
