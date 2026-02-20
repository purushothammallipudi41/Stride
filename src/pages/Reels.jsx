import { useState, useEffect } from 'react';
import { useContent } from '../context/ContentContext';
import ReelItem from '../components/reels/ReelItem';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CreateModal from '../components/create/CreateModal';
import '../components/reels/Reels.css';

const Reels = () => {
    const navigate = useNavigate();
    const { fetchPosts } = useContent();
    const [reelsData, setReelsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [remixData, setRemixData] = useState(null);

    const handleRemix = (reel) => {
        setRemixData({
            parentPostId: reel.id || reel._id,
            originalUsername: reel.username,
            music: {
                title: reel.musicTrack?.split(' - ')[0] || reel.musicTrack,
                artist: reel.musicTrack?.split(' - ')[1] || ''
            }
        });
    };

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
            <button className="reels-back-btn" onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                } else {
                    navigate('/');
                }
            }}>
                <ArrowLeft size={24} color="#fff" />
            </button>
            {reelsData.map(reel => (
                <ReelItem key={reel.id || reel._id} reel={reel} onRemix={handleRemix} />
            ))}

            <CreateModal
                isOpen={!!remixData}
                onClose={() => setRemixData(null)}
                initialTab="reel"
                lockTab={true}
                remixData={remixData}
            />
        </div>
    );
};

export default Reels;
