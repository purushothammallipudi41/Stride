import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    TrendingUp, Users, Eye, Heart, MessageCircle, ArrowLeft,
    Award, Zap, ChevronRight, BarChart3, Info, Gem, History
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import config from '../config';
import './CreatorDashboard.css';

const CreatorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user?.email) return;
            try {
                const token = localStorage.getItem('token');
                const [growthRes, engagementRes, topRes, earningsRes] = await Promise.all([
                    fetch(`${config.API_URL}/api/analytics/server/0/growth`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${config.API_URL}/api/analytics/posts/engagement`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${config.API_URL}/api/analytics/content/top`),
                    fetch(`${config.API_URL}/api/creator/earnings`, { headers: { Authorization: `Bearer ${token}` } })
                ]);


                if (growthRes.ok && engagementRes.ok && topRes.ok && earningsRes.ok) {
                    const growth = await growthRes.json();
                    const engagement = await engagementRes.json();
                    const top = await topRes.json();
                    const earnings = await earningsRes.json();


                    // Calculate totals from engagement list
                    const totalLikes = engagement.reduce((acc, p) => acc + (p.likes || 0), 0);
                    const totalComments = engagement.reduce((acc, p) => acc + (p.comments || 0), 0);
                    const totalViews = engagement.reduce((acc, p) => acc + (p.views || 0), 0);
                    const avgEngagement = engagement.length
                        ? (engagement.reduce((acc, p) => acc + parseFloat(p.engagementRate || 0), 0) / engagement.length).toFixed(1)
                        : 0;

                    setData({
                        summary: {
                            totalViews,
                            avgEngagement,
                            totalLikes,
                            totalComments,
                            totalEarnings: earnings.total,
                            tokenBalance: user.vibeTokens || 0
                        },
                        earningsHistory: earnings.history || [],
                        reachData: growth.length > 0
                            ? growth.map(g => ({ name: new Date(g.date).toLocaleDateString('en-US', { weekday: 'short' }), reach: g.members }))
                            : [{ name: 'Mon', reach: 0 }, { name: 'Tue', reach: 0 }, { name: 'Wed', reach: 0 }],
                        postPerformance: top.map(p => ({
                            title: p.caption || 'Media Post',
                            views: p.views || 0,
                            likes: p.likesCount || 0,
                            comments: p.commentsCount || 0
                        }))
                    });

                }
            } catch (e) {
                console.error('Failed to fetch analytics', e);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [user?.email]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loader-ring"></div>
                <p>Analyzing your reach...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="dashboard-page animate-in">
            <header className="dashboard-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="header-title">
                        <h1>Creator Pro</h1>
                        <div className="pro-badge">ACTIVE</div>
                    </div>
                </div>
                <div className="header-right">
                    <div className="user-profile-summary">
                        <img src={user.avatar || '/default-avatar.png'} alt={user.username} />
                        <span>@{user.username}</span>
                    </div>
                </div>
            </header>

            <main className="dashboard-content">
                {/* 1. Summary Cards */}
                <div className="stats-grid">
                    <div className="stat-card glass-card">
                        <div className="stat-icon-wrap views">
                            <Eye size={24} />
                        </div>
                        <div className="stat-main">
                            <h3>{data.summary.totalViews.toLocaleString()}</h3>
                            <p>Total Views</p>
                        </div>
                        <div className="stat-trend up">+12.5%</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon-wrap engagement">
                            <Zap size={24} />
                        </div>
                        <div className="stat-main">
                            <h3>{data.summary.avgEngagement}%</h3>
                            <p>Engagement Rate</p>
                        </div>
                        <div className="stat-trend up">+2.3%</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon-wrap community">
                            <Gem size={24} color="#fcd34d" />
                        </div>
                        <div className="stat-main">
                            <h3>{data.summary.totalEarnings.toLocaleString()}</h3>
                            <p>Total Tokens Earned</p>
                        </div>
                        <div className="stat-trend up">Ledger</div>
                    </div>
                </div>


                {/* 2. Reach Chart */}
                <div className="chart-section glass-card">
                    <div className="section-header">
                        <div className="title-wrap">
                            <BarChart3 size={20} />
                            <h2>Reach Overview</h2>
                        </div>
                        <div className="time-filter">
                            <span>Last 7 Days</span>
                        </div>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={data.reachData}>
                                <defs>
                                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="reach" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorReach)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Competitive & Post Analysis */}
                <div className="dashboard-grid-two-col">
                    <div className="post-performance glass-card">
                        <div className="section-header">
                            <h2>Top Performing Content</h2>
                        </div>
                        <div className="performance-list">
                            {data.postPerformance.map((post, i) => (
                                <div key={i} className="performance-item">
                                    <div className="rank">#{i + 1}</div>
                                    <div className="item-info">
                                        <h4>{post.title}</h4>
                                        <span>{post.views.toLocaleString()} views</span>
                                    </div>
                                    <div className="item-stats">
                                        <div className="mini-stat"><Heart size={12} /> {post.likes}</div>
                                        <div className="mini-stat"><MessageCircle size={12} /> {post.comments}</div>
                                    </div>
                                    <ChevronRight size={16} className="item-arrow" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="milestones glass-card">
                        <div className="section-header">
                            <div className="title-wrap">
                                <History size={20} />
                                <h2>Recent Earnings</h2>
                            </div>
                        </div>
                        <div className="earnings-history-list">
                            {data.earningsHistory.map((tx, i) => (
                                <div key={i} className="earnings-item animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div className="tx-info">
                                        <span className={`tx-type-tag ${tx.type}`}>{tx.type.replace('_', ' ')}</span>
                                        <h4>{tx.description}</h4>
                                        <p>{new Date(tx.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <div className="tx-amount">
                                        +{tx.amount} 🪙
                                    </div>
                                </div>
                            ))}
                            {data.earningsHistory.length === 0 && (
                                <div className="empty-state mini">
                                    <p>No earnings yet. Keep vibing!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default CreatorDashboard;
