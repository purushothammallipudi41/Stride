import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import VerticalFeed from '../components/feed/VerticalFeed';
import { BASE_URL } from '../utils/api';

const Reels = () => {
    const navigate = useNavigate();
    const [reelsData, setReelsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch posts of type 'video' or 'reel'
        fetch(`${BASE_URL}/api/feed?type=video`)
            .then(res => res.json())
            .then(data => {
                const videos = Array.isArray(data) ? data : [];
                if (videos.length > 0) {
                    setReelsData(videos);
                } else {
                    // Premium placeholders for initial WOW factor
                    setReelsData([
                        { 
                            _id: 'v1', 
                            username: 'vyx_official', 
                            likes: 1200, 
                            caption: 'Welcome to the Frequency. #vyx #social', 
                            contentUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-23101-large.mp4',
                            avatar: '',
                            type: 'video',
                            isVerified: true,
                            music: 'Vyx Theme - Original'
                        },
                        { 
                            _id: 'v2', 
                            username: 'frequencyic_aura', 
                            likes: 850, 
                            caption: 'Late night lo-fi sessions. 🎹', 
                            contentUrl: 'https://assets.mixkit.co/videos/preview/mixkit-recording-studio-with-dj-mixing-music-23097-large.mp4',
                            avatar: '',
                            type: 'video',
                            music: 'Lofi Nights - Aura'
                        }
                    ]);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch clips:", err);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) return <div className="loading-v2">Synthesizing frequency clips...</div>;

    return (
        <div className="reels-page-wrapper">
            <SEO 
                title="Frequencyic Clips" 
                description="Experience full-screen immersive video frequency on Vyx." 
            />
            <VerticalFeed 
                posts={reelsData} 
                onClose={() => navigate('/')} 
            />
        </div>
    );
};

export default Reels;
