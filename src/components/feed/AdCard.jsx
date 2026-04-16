import { ExternalLink, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import './AdCard.css';

const AdCard = ({ adData }) => {
    const defaultAd = {
        title: "Upgrade to Stride Pro",
        description: "Unlock exclusive vibe passes, premium avatar frames, and 2x rhythmic rewards.",
        image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop",
        cta: "Go Premium",
        link: "/settings/pro"
    };

    const data = adData || defaultAd;

    return (
        <div className="ad-card-v2 glass-panel animate-fade-in">
            <div className="ad-badge-group">
                <span className="sponsored-tag"><ShieldCheck size={12} /> SPONSORED</span>
                <span className="vibe-boost-tag"><TrendingUp size={12} /> RHYTHMIC MATCH</span>
            </div>

            <div className="ad-content-v2">
                <div className="ad-media-wrapper">
                    <img src={data.image} alt="Promotion" className="ad-media-img" loading="lazy" />
                    <div className="ad-media-overlay"></div>
                </div>

                <div className="ad-info-v2">
                    <h3 className="ad-title">{data.title}</h3>
                    <p className="ad-desc">{data.description}</p>
                    
                    <div className="ad-actions-v2">
                        <button className="ad-cta-btn" onClick={() => window.open(data.link, '_blank')}>
                            {data.cta} <ExternalLink size={14} />
                        </button>
                        <button className="ad-info-btn" title="About this ad">
                            <Info size={14} />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="ad-background-glow"></div>
        </div>
    );
};

export default AdCard;
