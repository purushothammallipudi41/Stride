import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    TrendingUp, Users, Eye, Heart, MessageCircle, ArrowLeft,
    Award, Zap, ChevronRight, BarChart3, Info
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
                const res = await fetch(`${config.API_URL}/api/users/${user.email}/analytics`);
                if (res.ok) {
                    const analyticsData = await res.json();
                    setData(analyticsData);
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
                            <Users size={24} />
                        </div>
                        <div className="stat-main">
                            <h3>{data.summary.totalLikes.toLocaleString()}</h3>
                            <p>Total Likes</p>
                        </div>
                        <div className="stat-trend down">-4.1%</div>
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
                            <h2>Creator Milestones</h2>
                        </div>
                        <div className="milestone-list">
                            <div className="milestone-item achieved">
                                <div className="m-icon"><Award size={20} /></div>
                                <div className="m-text">
                                    <h4>First 1K Views</h4>
                                    <p>Achieved on Mon</p>
                                </div>
                            </div>
                            <div className="milestone-item locked">
                                <div className="m-icon"><TrendingUp size={20} /></div>
                                <div className="m-text">
                                    <h4>Growth Master</h4>
                                    <p>Reach 10K total views</p>
                                </div>
                            </div>
                        </div>
                        <button className="pro-tips-btn">
                            <Info size={16} />
                            Get Creator Pro Tips
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CreatorDashboard;
