import React, { useState } from 'react';
import { Crown, Zap, Vote, ArrowRight, ShieldCheck } from 'lucide-react';
import { useUI } from '../../hooks/useUI';
import { getStoredUser, setStoredUser } from '../../utils/storage';
import { BASE_URL } from '../../utils/api';
import GlobalModal from '../common/GlobalModal';
import MonetizationService from '../../services/MonetizationService';

const PremiumCheckoutModal = ({ isOpen, onClose }) => {
    const { addNotification } = useUI();
    const [isProcessing, setIsProcessing] = useState(false);
    const user = getStoredUser();
    const username = user?.username || 'guest';
    const PRO_PRODUCT_ID = 'vyx_pro_lifetime';

    const handlePayment = async () => {
        if (username === 'guest') {
            addNotification({ title: 'Authentication Required', message: 'Please log in to upgrade to Pro.', type: 'error' });
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Get offerings from Google Play
            const offerings = await MonetizationService.getOfferings();
            const pkg = offerings?.availablePackages.find(p => p.product.identifier === PRO_PRODUCT_ID);

            if (!pkg) {
                // Fallback for dev/missing config: Try direct purchase by ID if supported, 
                // but usually we need the package object from offerings.
                console.warn('💎 Monetization: Offering not found, ensure Vyx Pro is configured in Play Console.');
                addNotification({ title: 'Store Error', message: 'Vyx Pro membership is currently unavailable in your region.', type: 'error' });
                setIsProcessing(false);
                return;
            }

            // 2. Trigger Native Purchase
            const purchaseResult = await MonetizationService.purchasePackage(pkg);
            
            if (purchaseResult.success) {
                const { customerInfo } = purchaseResult;
                
                // 3. Verify on Backend
                const verifyRes = await fetch(`${BASE_URL}/api/payments/google/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        purchaseToken: customerInfo.originalAppUserId, // RevenueCat handles the token mapping
                        productId: PRO_PRODUCT_ID,
                        userId: user.id || user._id
                    })
                });
                
                const data = await verifyRes.json();
                
                if (data.success) {
                    const updatedUser = { ...user, isPremium: true, avatarFrame: 'gold' };
                    setStoredUser(updatedUser);
                    
                    addNotification({ 
                        title: 'Upgrade Successful!', 
                        message: "Welcome to Vyx Pro! Your premium features are now active.", 
                        type: 'success' 
                    });
                    
                    onClose();
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    addNotification({ title: 'Verification Failed', message: data.error || 'Unable to sync purchase.', type: 'error' });
                }
            } else {
                addNotification({ title: 'Purchase Failed', message: purchaseResult.error || 'Payment cancelled or declined.', type: 'error' });
            }
        } catch (err) {
            console.error('💎 Payment Error:', err);
            addNotification({ title: 'Store Error', message: 'Unable to communicate with Google Play.', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <GlobalModal 
            isOpen={isOpen} 
            onClose={onClose}
            showClose={!isProcessing}
            maxWidth="550px"
        >
            <div className="premium-modal-v2">
                <div className="premium-hero-v2">
                    <img src="/images/promo/vyx_pro_banner.png" alt="Vyx Pro" />
                </div>

                <div className="premium-features-list">
                    <div className="feature-pill">
                        <div className="feature-icon-v2"><Crown size={24} /></div>
                        <div className="feature-info">
                            <h4>Premium Identity</h4>
                            <p>Exclusive Neon & Holographic frames to stand out in the frequency.</p>
                        </div>
                    </div>

                    <div className="feature-pill">
                        <div className="feature-icon-v2"><Zap size={24} /></div>
                        <div className="feature-info">
                            <h4>2x Frequencyic Rewards</h4>
                            <p>Double your Vibe Token earnings for all engagement and content.</p>
                        </div>
                    </div>

                    <div className="feature-pill">
                        <div className="feature-icon-v2"><Vote size={24} /></div>
                        <div className="feature-info">
                            <h4>Governance Power</h4>
                            <p>Draft and vote on official proposals to shape the future of Vyx.</p>
                        </div>
                    </div>
                </div>

                <div className="premium-checkout-footer">
                    <div className="premium-price-tag">
                        Upgrade <span>/ Lifetime Vyx Pro</span>
                    </div>

                    <button 
                        className="pay-btn-pro text-gradient-bg" 
                        onClick={handlePayment}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <><div className="loader-v2" /> Processing...</>
                        ) : (
                            <>Upgrade to Vyx Pro <ArrowRight size={20} /></>
                        )}
                    </button>
                    
                    <p className="secure-checkout-hint">
                        <ShieldCheck size={12} /> Secure Checkout via Google Play
                    </p>
                </div>
            </div>
        </GlobalModal>
    );
};

export default PremiumCheckoutModal;
