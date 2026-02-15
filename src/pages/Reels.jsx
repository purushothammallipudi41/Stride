import { useState, useEffect } from 'react';
import { useContent } from '../context/ContentContext';
import ReelItem from '../components/reels/ReelItem';
import '../components/reels/Reels.css';

const Reels = () => {
    const { fetchPosts } = useContent();
    const [reelsData, setReelsData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReels = async () => {
            const data = await fetchPosts({ type: 'reel', limit: 50 });
            setReelsData(data || []);
            setLoading(false);
        };
        loadReels();
    }, []);

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="loading-spinner"></div></div>;

    if (reelsData.length === 0) {
        return (
            <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '16px', color: '#fff' }}>
                <div style={{ fontSize: '3rem' }}>🎥</div>
                <h2>No Reels Yet</h2>
                <p style={{ opacity: 0.7 }}>Be the first to create one!</p>
            </div>
        );
    }

    return (
        <div className="reels-container">
            {reelsData.map(reel => (
                <ReelItem key={reel.id || reel._id} reel={reel} />
            ))}
        </div>
    );
};

export default Reels;
