import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Play, ArrowUpRight, Award } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import './ArtistDashboard.css';

const ArtistDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [stats, setStats] = useState({ totalListens: 0, totalTips: 0, followerGrowth: 0 });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [topTracks, setTopTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/artist/stats/${user.username}`);
                const data = await res.json();
                
                // Aggregating mock/real stats
                const totalListens = data.stats.reduce((acc, curr) => acc + curr.listens, 0);
                const totalTips = data.stats.reduce((acc, curr) => acc + curr.tips, 0);
                
                setStats({
                    totalListens: totalListens || 1240, // Mock fallback if empty
                    totalTips: totalTips || 45.50,
                    followerGrowth: 12
                });
                setRecentTransactions(data.recentTransactions || []);
                setTopTracks(data.stats.sort((a, b) => b.listens - a.listens).slice(0, 5));
                setIsLoading(false);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [user.username]);

    if (isLoading) return <div className="loading-screen">Syncing your vibe metrics...</div>;

    return (
        <div className="dashboard-container">
            <PageHeader title="Artist Dashboard" />
            
            <div className="stats-grid">
                <div className="stat-card glass-card">
                    <div className="stat-icon-wrapper listens">
                        <Play size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalListens.toLocaleString()}</h3>
                        <p>Total Listens</p>
                        <span className="trend positive"><ArrowUpRight size={14} /> 8.4%</span>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon-wrapper tips">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>${stats.totalTips.toFixed(2)}</h3>
                        <p>Earnings 💰</p>
                        <span className="trend positive"><ArrowUpRight size={14} /> 12.1%</span>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon-wrapper followers">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.followerGrowth}%</h3>
                        <p>Weekly Growth</p>
                        <span className="trend positive"><Award size={14} /> Top 5%</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-main-grid">
                <section className="dashboard-section glass-card">
                    <div className="section-header">
                        <h3>Top Performing Tracks</h3>
                        <TrendingUp size={20} className="text-primary" />
                    </div>
                    <div className="track-stats-list">
                        {topTracks.length > 0 ? topTracks.map(track => (
                            <div key={track.trackId} className="track-stat-row">
                                <div className="track-info">
                                    <span className="track-name">{track.trackId}</span>
                                    <div className="mini-progress-bg">
                                        <div className="mini-progress-fill" style={{ width: `${(track.listens / 2000) * 100}%` }} />
                                    </div>
                                </div>
                                <span className="listens-count">{track.listens}</span>
                            </div>
                        )) : (
                            <div className="empty-state">No track data yet. Keep creating!</div>
                        )}
                    </div>
                </section>

                <section className="dashboard-section glass-card">
                    <div className="section-header">
                        <h3>Recent Support</h3>
                        <DollarSign size={20} className="text-accent" />
                    </div>
                    <div className="transactions-list">
                        {recentTransactions.map(tx => (
                            <div key={tx._id} className="transaction-row">
                                <span className="tx-user">@{tx.from?.username}</span>
                                <span className="tx-type">{tx.type}</span>
                                <span className="tx-amount">+${tx.amount.toFixed(2)}</span>
                            </div>
                        ))}
                        {recentTransactions.length === 0 && (
                            <div className="empty-state">No transactions yet.</div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ArtistDashboard;
