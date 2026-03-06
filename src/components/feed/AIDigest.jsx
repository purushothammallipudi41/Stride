import { useState, useEffect } from 'react';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import './AIDigest.css';

const AIDigest = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState('');

    const fetchDigest = async () => {
        setLoading(true);
        try {
            // Simulated fetch for MVP. In reality, would fetch user's unread feed and summarize.
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const data = await res.json();
            let rawPost = data.post || "Your personalized vibe check is ready! Deep tech house is trending in the Electronic server, and 5 new artists just joined Stride.";

            // Safety check: if backend returns JSON block as string
            if (typeof rawPost === 'string' && rawPost.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(rawPost);
                    rawPost = parsed.explanation || parsed.label || rawPost;
                } catch (e) { }
            }

            setSummary(rawPost);

        } catch (e) {
            setSummary("Stride AI is currently reflecting on the network pulse. Check back in a bit for your personalized summary!");
        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDigest();
    }, []);

    if (!isVisible) return null;

    return (
        <div className="ai-digest-card animate-in">
            <div className="digest-header">
                <div className="title-group">
                    <div className="pulse-icon">
                        <Sparkles size={16} />
                    </div>
                    <span>Stride AI Daily Digest</span>

                </div>
                <button className="close-digest" onClick={() => setIsVisible(false)}>
                    <X size={14} />
                </button>
            </div>

            <div className="digest-content">
                {loading ? (
                    <div className="digest-skeleton">
                        <div className="line long"></div>
                        <div className="line short"></div>
                    </div>
                ) : (
                    <p>{summary}</p>
                )}
            </div>

            {!loading && (
                <div className="digest-footer">
                    <button className="read-more-btn">
                        Explore Insights <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AIDigest;
