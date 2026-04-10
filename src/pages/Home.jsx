import { useState } from 'react';
import Feed from '../components/feed/Feed';
import StoriesRail from '../components/feed/StoriesRail';
import Topbar from '../components/layout/Topbar';
import SEO from '../components/common/SEO';
import './Home.css';

const Home = () => {
    const [feedType, setFeedType] = useState('foryou');
    const [headerVisible, setHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const handleScroll = (e) => {
        const currentScrollY = e.currentTarget.scrollTop;
        
        // Only trigger after initial scroll to avoid jitter
        if (currentScrollY > 10) {
            if (currentScrollY > lastScrollY) {
                // Scrolling down
                setHeaderVisible(false);
            } else {
                // Scrolling up
                setHeaderVisible(true);
            }
        } else {
            // At the very top
            setHeaderVisible(true);
        }
        
        setLastScrollY(currentScrollY);
    };

    return (
        <div 
            className="home-page-v2 animate-fade-in" 
            onScroll={handleScroll}
        >
            <div className={`topbar-wrapper ${headerVisible ? 'visible' : 'hidden'}`}>
                <Topbar />
            </div>
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
                .home-page-v2 { width: 100%; height: 100%; padding: 0; overflow-y: auto; overflow-x: hidden; }
                .topbar-wrapper { 
                    position: sticky; 
                    top: 0; 
                    z-index: 1100; 
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
                    width: 100%; 
                }
                .topbar-wrapper.hidden { transform: translateY(-100%); pointer-events: none; }
                .topbar-wrapper.visible { transform: translateY(0); }
                
                .home-layout { display: flex; width: 100%; padding: 24px; padding-top: 0; }
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


