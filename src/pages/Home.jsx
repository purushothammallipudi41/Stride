import { useState } from 'react';
import Feed from '../components/feed/Feed';
import StoriesRail from '../components/feed/StoriesRail';
import SEO from '../components/common/SEO';
import './Home.css';

const Home = () => {
    const [feedType, setFeedType] = useState('foryou'); // 'foryou' or 'following'

    return (
        <div className="home-page-v2 animate-fade-in">
            <SEO 
                title="Home" 
                description="Experience the rhythm of Stride. Follow your favorite artists and discover new music in your social feed." 
            />
            
            <div className="home-layout">
                {/* Main Feed Column */}
                <div className="main-column">
                    <section className="stories-section">
                        <StoriesRail />
                    </section>

                    <div className="feed-tabs">
                        <button 
                            className={`feed-tab ${feedType === 'foryou' ? 'active' : ''}`}
                            onClick={() => setFeedType('foryou')}
                        >
                            For You
                        </button>
                        <button 
                            className={`feed-tab ${feedType === 'following' ? 'active' : ''}`}
                            onClick={() => setFeedType('following')}
                        >
                            Following
                        </button>
                    </div>

                    <section className="feed-section">
                        <Feed type={feedType} />
                    </section>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .home-page-v2 { width: 100%; height: 100%; padding: 24px; overflow-y: auto; }
                .home-layout { display: flex; width: 100%; }
                .main-column { flex: 1; max-width: 100%; }
                
                @media (max-width: 1000px) {
                    .home-page-v2 { padding: 12px; }
                }

                .feed-tabs { display: flex; border-bottom: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 24px; }
                .feed-tab { background: transparent; border: none; padding: 12px 24px; color: var(--color-text-muted); font-weight: 700; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
                .feed-tab.active { color: var(--color-text-primary); border-bottom-color: var(--color-primary); }
                .feed-tab:hover { color: var(--color-text-primary); }
            `}} />
        </div>
    );
};

export default Home;


