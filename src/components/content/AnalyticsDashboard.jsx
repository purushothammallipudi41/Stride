import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Play, MessageSquare, Heart, TrendingUp } from 'lucide-react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ communityId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/analytics/community/${communityId}`, {
                    headers: { 'x-user-id': user._id }
                });
                if (!response.ok) throw new Error('Failed to fetch analytics');
                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (communityId) {
            fetchAnalytics();
        }
    }, [communityId]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader"></div>
            </div>
        );
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    const getStat = (type) => {
        const stat = data?.stats?.find(s => s._id === type);
        return stat ? stat.count : 0;
    };

    return (
        <div className="analytics-dashboard">
            <div className="analytics-header">
                <h2>Community Insights</h2>
                <div className="time-range">Last 24 Hours</div>
            </div>

            <div className="stats-grid">
                <div className="stat-card join">
                    <div className="stat-label">
                        <Users size={16} /> New Joins
                    </div>
                    <div className="stat-value">{getStat('join')}</div>
                </div>
                <div className="stat-card play">
                    <div className="stat-label">
                        <Play size={16} /> Tracks Played
                    </div>
                    <div className="stat-value">{getStat('play')}</div>
                </div>
                <div className="stat-card message">
                    <div className="stat-label">
                        <MessageSquare size={16} /> Messages
                    </div>
                    <div className="stat-value">{getStat('message')}</div>
                </div>
                <div className="stat-card vibe">
                    <div className="stat-label">
                        <Heart size={16} /> Vibes (Votes)
                    </div>
                    <div className="stat-value">{getStat('vibe')}</div>
                </div>
            </div>

            <div className="charts-section">
                <div className="chart-container main-activity">
                    <h3>
                        <BarChart3 size={18} /> Activity Trends
                    </h3>
                    <div className="activity-visualizer">
                        {/* Simple animated bars to represent "activity" */}
                        {[...Array(12)].map((_, i) => (
                            <div 
                                key={i} 
                                className="activity-bar" 
                                style={{ 
                                    height: `${20 + Math.random() * 80}%`,
                                    animationDelay: `${i * 0.1}s`
                                }}
                            ></div>
                        ))}
                    </div>
                </div>

                <div className="chart-container top-tracks">
                    <h3>
                        <TrendingUp size={18} /> Top Tracks
                    </h3>
                    <ul className="top-tracks-list">
                        {data?.topTracks?.length > 0 ? (
                            data.topTracks.map((track, index) => (
                                <li key={index} className="top-track-item">
                                    <div className="track-rank">#{index + 1}</div>
                                    <div className="track-info">
                                        <span className="track-name">{track._id}</span>
                                        <span className="track-artist">{track.artist}</span>
                                    </div>
                                    <div className="track-plays">{track.plays} plays</div>
                                </li>
                            ))
                        ) : (
                            <div className="no-data">No track data yet</div>
                        )}
                    </ul>
                </div>
            </div>
            
            <style jsx>{`
                .activity-visualizer {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    height: 150px;
                    padding-top: 20px;
                }
                .activity-bar {
                    width: 6%;
                    background: linear-gradient(to top, #8b5cf6, #d946ef);
                    border-radius: 4px;
                    transition: height 0.5s ease;
                    animation: pulse 2s infinite alternate ease-in-out;
                }
                @keyframes pulse {
                    from { opacity: 0.6; }
                    to { opacity: 1; }
                }
                .no-data {
                    color: #a1a1a1;
                    font-size: 14px;
                    text-align: center;
                    padding: 20px;
                }
            `}</style>
        </div>
    );
};

export default AnalyticsDashboard;
