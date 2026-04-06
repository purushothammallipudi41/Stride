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
                setReelsData(data);
                setIsLoading(false);
                if (data.length > 0) setActiveReelId(data[0].id);
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
