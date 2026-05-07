import { useState, useRef } from 'react';
import Feed from '../components/feed/Feed';
import StoriesRail from '../components/feed/StoriesRail';
import Topbar from '../components/layout/Topbar';
import SEO from '../components/common/SEO';
import './Home.css';

const Home = () => {
    const [feedType] = useState('foryou');
    const [headerVisible, setHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const touchStartRef = useRef(0);

    const handleTouchStart = (e) => {
        if (e.currentTarget.scrollTop <= 0) {
            touchStartRef.current = e.touches[0].clientY;
        } else {
            touchStartRef.current = 0;
        }
    };

    const handleTouchMove = (e) => {
        if (touchStartRef.current === 0) return;
        
        const touchY = e.touches[0].clientY;
        const distance = touchY - touchStartRef.current;
        
        if (distance > 0 && e.currentTarget.scrollTop <= 0) {
            // Dragging down at the top
            setPullDistance(Math.min(distance * 0.5, 80)); // Resistance
            if (distance > 10) e.preventDefault(); // Prevent native bounce if dragging significantly
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > 60) {
            triggerRefresh();
        }
        setPullDistance(0);
        touchStartRef.current = 0;
    };

    const triggerRefresh = () => {
        setIsRefreshing(true);
        // We'll increment a key to force Feed to remount/re-fetch
        setRefreshKey(prev => prev + 1);
        setTimeout(() => setIsRefreshing(false), 1500);
    };

    const [refreshKey, setRefreshKey] = useState(0);

    const handleScroll = (e) => {
        const currentScrollY = e.currentTarget.scrollTop;
        
        // Only trigger after initial scroll to avoid jitter
        if (currentScrollY > 10) {
            if (currentScrollY > lastScrollY) {
                setHeaderVisible(false);
            } else {
                setHeaderVisible(true);
            }
        } else {
            setHeaderVisible(true);
        }
        
        setLastScrollY(currentScrollY);
    };

    return (
        <div 
            className="home-page-v2 animate-fade-in" 
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className={`topbar-wrapper ${headerVisible ? 'visible' : 'hidden'}`}>
                <Topbar />
            </div>

            {/* Pull-to-Refresh Indicator */}
            <div 
                className="ptr-indicator" 
                style={{ 
                    height: isRefreshing ? '60px' : `${pullDistance}px`,
                    opacity: (isRefreshing || pullDistance > 20) ? 1 : 0
                }}
            >
                <div className="ptr-spinner"></div>
            </div>
            <SEO 
                title="Home" 
                description="Experience the frequency of Vyx. Follow your favorite artists and discover new music in your social feed." 
            />
            
            <div className="home-layout">
                {/* Main Feed Column */}
                <div className="main-column">
                    <section className="stories-section">
                        <StoriesRail />
                    </section>


                    <section className="feed-section">
                        <Feed key={`${feedType}-${refreshKey}`} type={feedType} />
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


