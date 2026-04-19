import { useState } from 'react';
import { Crown, CheckCircle, Loader2 } from 'lucide-react';
import { BASE_URL } from '../../utils/api';

const SubscribeButton = ({ creatorUsername, subscriberUsername, price = 50 }) => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!subscriberUsername) {
            alert("Please login to subscribe.");
            return;
        }
        
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/creator/subscribe/${creatorUsername}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriberUsername })
            });
            const data = await res.json();
            if (data.success) {
                setIsSubscribed(true);
                // Trigger a global wallet update if needed
                window.dispatchEvent(new CustomEvent('balance_updated', { detail: data.balance }));
            } else {
                alert(data.error || "Subscription failed");
            }
        } catch (err) {
            console.error("Subscribe failed:", err);
            alert("Connection error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubscribed) {
        return (
            <button className="subscribed-badge-btn" disabled>
                <CheckCircle size={18} /> <span>Active Supporter</span>
            </button>
        );
    }

    return (
        <button 
            className={`subscribe-btn-premium ${isLoading ? 'loading' : ''}`} 
            onClick={handleSubscribe}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
            ) : (
                <>
                    <Crown size={18} />
                    <span>Join Club</span>
                    <span className="price-tag">{price} ⚡</span>
                </>
            )}
        </button>
    );
};

export default SubscribeButton;
