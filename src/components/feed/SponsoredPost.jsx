import { useEffect } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import config from '../../config';
import './SponsoredPost.css';

const SponsoredPost = ({ ad }) => {
    useEffect(() => {
        // Track view
        const trackView = async () => {
            try {
                fetch(`${config.API_URL}/api/ads/${ad._id}/view`, { method: 'POST' });
            } catch (err) {
                console.error('Failed to track ad view:', err);
            }
        };
        trackView();
    }, [ad._id]);

    const handleClick = async () => {
        // Track click
        try {
            fetch(`${config.API_URL}/api/ads/${ad._id}/click`, { method: 'POST' });
        } catch (err) {
            console.error('Failed to track ad click:', err);
        }
        window.open(ad.link, '_blank');
    };

    return (
        <div className="sponsored-post animate-fade-in" onClick={handleClick}>
            <div className="sponsored-header">
                <div className="sponsored-label">
                    <Info size={14} />
                    <span>Sponsored</span>
                </div>
            </div>

            <div className="sponsored-media-container">
                <img src={ad.image} alt={ad.title} className="sponsored-media" />
                <div className="sponsored-overlay">
                    <div className="sponsored-content">
                        <h3 className="sponsored-title">{ad.title}</h3>
                        <p className="sponsored-desc">{ad.content}</p>
                    </div>
                    <button className="sponsored-cta">
                        Learn More
                        <ExternalLink size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SponsoredPost;
