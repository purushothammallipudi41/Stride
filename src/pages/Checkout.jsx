import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, ShieldCheck, Lock, ChevronLeft, CreditCard as CardIcon } from 'lucide-react';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import { hapticNotification } from '../utils/haptics';
import { NotificationType } from '@capacitor/haptics';
import PageHeader from '../components/layout/PageHeader';
import SEO from '../components/common/SEO';
import './Checkout.css';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const itemType = queryParams.get('item') || 'Premium Item';
    const itemName = queryParams.get('name') || 'Gold Frame';
    const itemPrice = queryParams.get('price') || '50.00';
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
    const [error, setError] = useState('');

    const user = getStoredUser();

    const handlePayment = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setError('');

        // Simulate network delay for "Realism"
        setTimeout(async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/wallet/purchase-frame`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        username: user.username, 
                        frame: itemName.toLowerCase().replace(' frame', ''),
                        paymentMethod: 'card'
                    })
                });
                const data = await res.json();
                if (data.success) {
                    setIsSuccess(true);
                    hapticNotification(NotificationType.Success);
                    setTimeout(() => {
                        navigate('/profile', { state: { purchaseSuccess: true } });
                    }, 3000);
                } else {
                    setError(data.message || 'Payment declined by bank.');
                    hapticNotification(NotificationType.Error);
                    setIsProcessing(false);
                }
            } catch (err) {
                setError('Payment gateway timeout. Please try again.');
                hapticNotification(NotificationType.Error);
                setIsProcessing(false);
            }
        }, 2500);
    };

    if (isSuccess) {
        return (
            <div className="checkout-success-container">
                <div className="success-card">
                    <div className="success-icon-wrapper">
                        <ShieldCheck size={64} className="success-icon" />
                    </div>
                    <h2>Payment Successful</h2>
                    <p>Your {itemName} has been unlocked!</p>
                    <div className="redirect-hint">Redirecting to profile...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <SEO title="Secure Checkout" description="Finalize your Vyx premium purchase." />
            <div className="checkout-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h1>Secure Checkout</h1>
            </div>

            <div className="checkout-container">
                <div className="checkout-summary animate-slide-in">
                    <h3>Order Summary</h3>
                    <div className="summary-item">
                        <div className="item-info">
                            <span className="item-label">{itemName}</span>
                            <span className="item-category">{itemType}</span>
                        </div>
                        <span className="item-price">${itemPrice}</span>
                    </div>
                    <div className="summary-divider" />
                    <div className="summary-total">
                        <span>Total Due</span>
                        <span>${itemPrice}</span>
                    </div>
                </div>

                <form className="checkout-form animate-fade-in" onSubmit={handlePayment}>
                    <div className="payment-methods">
                        <div className="method-tab active">
                            <CreditCard size={18} />
                            <span>Credit / Debit Card</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Cardholder Name</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="John Doe" 
                            value={cardData.name}
                            onChange={e => setCardData({...cardData, name: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Card Number</label>
                        <div className="input-with-icon">
                            <CardIcon size={18} className="input-icon" />
                            <input 
                                type="text" 
                                required 
                                placeholder="0000 0000 0000 0000" 
                                value={cardData.number}
                                onChange={e => setCardData({...cardData, number: e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()})}
                                maxLength={19}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Expiry Date</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="MM/YY" 
                                value={cardData.expiry}
                                onChange={e => setCardData({...cardData, expiry: e.target.value})}
                                maxLength={5}
                            />
                        </div>
                        <div className="form-group">
                            <label>CVC</label>
                            <div className="input-with-icon">
                                <Lock size={16} className="input-icon" />
                                <input 
                                    type="password" 
                                    required 
                                    placeholder="123" 
                                    value={cardData.cvc}
                                    onChange={e => setCardData({...cardData, cvc: e.target.value})}
                                    maxLength={3}
                                />
                            </div>
                        </div>
                    </div>

                    {error && <div className="checkout-error">{error}</div>}

                    <button className="pay-now-btn" disabled={isProcessing}>
                        {isProcessing ? (
                            <div className="spinner"></div>
                        ) : (
                            `Pay $${itemPrice}`
                        )}
                    </button>

                    <p className="secure-hint">
                        <ShieldCheck size={14} /> 
                        Your payment is encrypted and secured by Vyx Pay.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Checkout;
