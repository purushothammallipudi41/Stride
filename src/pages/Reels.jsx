import { useState, useEffect, useRef } from 'react';
import SEO from '../components/common/SEO';
import ReelItem from '../components/reels/ReelItem';
import '../components/reels/Reels.css';

import { BASE_URL } from '../utils/api';

const Reels = () => {
    const [activeReelId, setActiveReelId] = useState(null);
    const [reelsData, setReelsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef(null);

    useEffect(() => {
        fetch(`${BASE_URL}/api/reels`)
            .then(res => res.json())
            .then(data => {
                if (data.length > 0) {
                    setReelsData(data);
                    setActiveReelId(data[0].id);
                } else {
                    // Fallback to premium curated reels if DB is empty
                    const placeholders = [
                        { id: 9991, username: 'stride_official', likes: '1.2k', caption: 'Welcome to the Rhythm. #stride #vibes', url: 'https://cdn.pixabay.com/vimeo/459239103/concert-50474.mp4?width=1080&hash=8de26ec090e50f589c316719545371ae23d8c835', avatar: 'https://i.pravatar.cc/150?u=stride' },
                        { id: 9992, username: 'alex_stride', likes: '840', caption: 'Late night sessions. 🎹 #music #producer', url: 'https://cdn.pixabay.com/vimeo/321151662/music-21583.mp4?width=1080&hash=d1e37bc6093558c356719545371ae23d8c835', avatar: 'https://i.pravatar.cc/150?u=alex' }
                    ];
                    setReelsData(placeholders);
                    setActiveReelId(9991);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch reels:", err);
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (isLoading || reelsData.length === 0) return;

        const observerOptions = {
            root: containerRef.current,
            threshold: 0.8
        };

        const handleIntersection = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveReelId(Number(entry.target.dataset.id));
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, observerOptions);
        const elements = containerRef.current.querySelectorAll('.reel-item-wrapper');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [isLoading, reelsData]);

    return (
        <div className="reels-container" ref={containerRef}>
            <SEO 
                title="Reels" 
                description="Discover short, engaging music videos and creative reels from the Stride community." 
            />
            {reelsData.map(video => (
                <div key={video.id} className="reel-item-wrapper" data-id={video.id}>
                    <ReelItem video={video} isActive={activeReelId === video.id} />
                </div>
            ))}
        </div>
    );
};

export default Reels;
