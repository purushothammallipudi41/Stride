import { useState, useEffect } from 'react';
import { Heart, Users, Star, MessageSquare, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageUtils';
import config from '../../config';
import './ActivityFeed.css';

const ACTION_CONFIG = {
    SUBSCRIPTION_CREATED: { icon: Star, color: '#a855f7', label: 'subscribed to a server' },
    MEMBER_JOINED: { icon: Users, color: '#3b82f6', label: 'joined a server' },
    TIP_SENT: { icon: Heart, color: '#ef4444', label: 'sent a tip' },
};

const ActivityFeed = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        fetch(`${config.API_URL}/api/activity`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch activity');
                return res.json();
            })
            .then(data => {
                setLogs(data.logs || []);
                setStories(data.recentStories || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [user]);

    if (loading) {
        return (
            <div className="activity-feed-skeleton">
                {[1, 2, 3].map(i => <div key={i} className="skeleton-row" />)}
            </div>
        );
    }

    if (logs.length === 0 && stories.length === 0) {
        return (
            <div className="activity-feed-empty">
                <MessageSquare size={28} opacity={0.3} />
                <p>Follow people to see their activity here.</p>
            </div>
        );
    }

    return (
        <div className="activity-feed">
            {stories.length > 0 && (
                <div className="activity-section">
                    <div className="activity-section-header">
                        <span className="activity-label">📖 Recent Stories</span>
                    </div>
                    <div className="activity-stories-row">
                        {stories.slice(0, 5).map(s => (
                            <div key={s._id} className="activity-story-thumb">
                                <img src={getImageUrl(s.userAvatar, 'user')} alt={s.username} />
                                <span>{s.username?.split(' ')[0]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {logs.length > 0 && (
                <div className="activity-section">
                    <div className="activity-section-header">
                        <span className="activity-label">⚡ Activity</span>
                    </div>
                    <div className="activity-list">
                        {logs.map(log => {
                            const cfg = ACTION_CONFIG[log.action] || { icon: ChevronRight, color: '#6b7280', label: log.action };
                            const Icon = cfg.icon;
                            return (
                                <div key={log._id} className="activity-item">
                                    <div className="activity-icon" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                                        <Icon size={14} />
                                    </div>
                                    <div className="activity-text">
                                        <span className="activity-user">{log.actorUserId?.split('@')[0]}</span>
                                        <span className="activity-action"> {cfg.label}</span>
                                    </div>
                                    <span className="activity-time">
                                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityFeed;
