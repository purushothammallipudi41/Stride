import { useContent } from '../context/ContentContext';
import ReelItem from '../components/reels/ReelItem';
import '../components/reels/Reels.css';

const Reels = () => {
    const { posts } = useContent();

    // Filter for video posts or specific 'reel' type
    const reelsData = posts.filter(post => post.videoUrl || post.type === 'reel' || post.mediaType === 'video');

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
