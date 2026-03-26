import { useState, useEffect } from 'react';
import { Crown, CheckCircle } from 'lucide-react';

const SubscribeButton = ({ creatorUsername, subscriberUsername, price = 50 }) => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Fetch current subscription status if needed, 
        // or rely on user data passed from parent
    }, [creatorUsername]);

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/creator/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriberUsername, creatorUsername })
            });
            const data = await res.json();
            if (data.success) {
                setIsSubscribed(true);
            } else {
                alert(data.error || "Subscription failed");
            }
        } catch (err) {
            console.error("Subscribe failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubscribed) {
        return (
            <button className="subscribed-badge-btn" disabled>
                <CheckCircle size={18} /> Subscribed
            </button>
        );
    }

    return (
        <button 
            className="subscribe-btn-premium" 
            onClick={handleSubscribe}
            disabled={isLoading}
        >
            <Crown size={18} />
            <span>Join Member Club</span>
            <span className="price-tag">{price}c</span>
        </button>
    );
};

export default SubscribeButton;
