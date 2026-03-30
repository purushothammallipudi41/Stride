import { useState, useEffect } from 'react';
import { Music, Play } from 'lucide-react';

const FriendsActivity = () => {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user._id) return;

        fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'}/api/friends/activity?userId=${user._id}`)
            .then(res => res.json())
            .then(data => {
                setActivities(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    if (isLoading) return null;

    return (
        <div className="friends-activity">
            <h4 className="section-title">Friends Activity</h4>
            <div className="activity-list">
                {activities.map((act, i) => (act.user && (
                    <div key={i} className="activity-item">
                        <div className="activity-avatar">
                            <img src={act.user.avatar} alt="" />
                            <div className="activity-indicator"></div>
                        </div>
                        <div className="activity-content">
                            <div className="activity-user">
                                <span className="friend-name">{act.user.username}</span>
                                <span className="time-ago">{act.time}</span>
                            </div>
                            <div className="now-listening">
                                <Music size={12} />
                                <span className="track-info">{act.track.title} • {act.track.artist}</span>
                            </div>
                        </div>
                        <button className="vibe-check-btn"><Play size={14} /></button>
                    </div>
                )))}
                {activities.length === 0 && (
                    <p className="no-activity">Follow friends to see what they're vibing to!</p>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .friends-activity { padding: 4px; }
                .section-title { font-size: 0.9rem; font-weight: 700; margin-bottom: 20px; color: var(--color-text-muted); }
                .activity-list { display: flex; flex-direction: column; gap: 16px; }
                .activity-item { display: flex; align-items: center; gap: 12px; }
                .activity-avatar { position: relative; width: 40px; height: 40px; }
                .activity-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
                .activity-indicator { position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 2px solid #000; border-radius: 50%; }
                .activity-content { flex: 1; display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
                .activity-user { display: flex; justify-content: space-between; align-items: center; }
                .friend-name { font-size: 0.85rem; font-weight: 700; color: #fff; }
                .time-ago { font-size: 0.7rem; color: var(--color-text-muted); }
                .now-listening { display: flex; align-items: center; gap: 6px; color: var(--color-primary); font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .track-info { font-weight: 500; }
                .vibe-check-btn { width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 255, 255, 0.05); border: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                .vibe-check-btn:hover { background: var(--color-primary); transform: scale(1.1); }
                .no-activity { font-size: 0.8rem; color: var(--color-text-muted); text-align: center; font-style: italic; }
            `}} />
        </div>
    );
};

export default FriendsActivity;
