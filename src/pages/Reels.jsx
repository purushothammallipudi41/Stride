import ReelItem from '../components/reels/ReelItem';
import '../components/reels/Reels.css';

const Reels = () => {
    const reelsData = [
        {
            id: 1,
            username: "dance_daily",
            caption: "Learning this new choreo! 💃 #dance #viral",
            musicTrack: "Original Audio - dance_daily",
            likes: "45.2K",
            comments: "1.2K",
            videoUrl: "https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=987&auto=format&fit=crop" // Placeholder image
        },
        {
            id: 2,
            username: "travel_diaries",
            caption: "Sunset in Santorini 🌅 Take me back.",
            musicTrack: "Golden Hour - JVKE",
            likes: "120K",
            comments: "3.4K",
            videoUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=987&auto=format&fit=crop"
        },
        {
            id: 3,
            username: "tech_guru",
            caption: "The new M4 chip is insane! 🚀 #tech #apple",
            musicTrack: "Technology - Daft Punk",
            likes: "12.5K",
            comments: "800",
            videoUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop"
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
