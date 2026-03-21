import { useState } from 'react';
import Feed from '../components/feed/Feed';
import StoriesRail from '../components/feed/StoriesRail';
import Topbar from '../components/layout/Topbar';
import FriendsActivity from '../components/social/FriendsActivity';
import './Home.css';

const Home = () => {
    const [feedType, setFeedType] = useState('foryou'); // 'foryou' or 'following'

    return (
        <div className="home-page-v2 animate-fade-in">
            <Topbar />
            
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

                {/* Right Column: Social Discovery & Activity */}
                <aside className="side-column">
                    <FriendsActivity />
                    <div className="discovery-prompt">
                        <h4>Discovery</h4>
                        <p>Explore communities based on your vibes</p>
                        <button className="explore-btn">Explore</button>
                    </div>
                </aside>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .home-page-v2 { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .home-layout { display: flex; gap: 32px; }
                .main-column { flex: 1; max-width: 630px; }
                .side-column { width: 320px; display: flex; flex-direction: column; gap: 24px; }
                
                @media (max-width: 1000px) {
                    .side-column { display: none; }
                    .home-page-v2 { padding: 0; }
                    .main-column { max-width: 100%; }
                }

                .feed-tabs { display: flex; border-bottom: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 24px; }
                .feed-tab { background: transparent; border: none; padding: 12px 24px; color: var(--color-text-muted); font-weight: 700; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
                .feed-tab.active { color: var(--color-text-primary); border-bottom-color: var(--color-primary); }
                .feed-tab:hover { color: var(--color-text-primary); }

                .discovery-prompt { padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.05); }
                .discovery-prompt h4 { margin-top: 0; margin-bottom: 8px; font-size: 0.9rem; }
                .discovery-prompt p { font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 16px; }
                .explore-btn { width: 100%; padding: 8px; border-radius: 8px; background: var(--color-primary); border: none; color: white; font-weight: 600; cursor: pointer; }
            `}} />
        </div>
    );
};

export default Home;

