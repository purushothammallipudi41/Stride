import ReelItem from '../components/reels/ReelItem';
import '../components/reels/Reels.css';

const Reels = () => {
    const reelsData = [
        {
            id: 1,
            userId: "2",
            username: "dance_daily",
            caption: "Learning this new choreo! 💃 #dance #viral",
            musicTrack: "Original Audio - dance_daily",
            likes: "45.2K",
            comments: "1.2K",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        },
        {
            id: 2,
            userId: "1",
            username: "travel_diaries",
            caption: "Sunset in Santorini 🌅 Take me back.",
            musicTrack: "Golden Hour - JVKE",
            likes: "120K",
            comments: "3.4K",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        },
        {
            id: 3,
            userId: "2",
            username: "tech_guru",
            caption: "The new M4 chip is insane! 🚀 #tech #apple",
            musicTrack: "Technology - Daft Punk",
            likes: "12.5K",
            comments: "800",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
        }
    ];

    return (
        <div className="reels-container">
            {reelsData.map(reel => (
                <ReelItem key={reel.id} reel={reel} />
            ))}
        </div>
    );
};

export default Reels;
