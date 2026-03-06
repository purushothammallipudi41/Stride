import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from 'recharts';
import { Calendar, TrendingUp, Clock, Trash2, Wallet, ArrowUpRight, ArrowDownLeft, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import './StrideInsights.css';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

function StatCard({ label, value, change, icon, color }) {
    const isPositive = change >= 0;
    return (
        <div className="insight-stat-card" style={{ '--card-color': color }}>
            <div className="insight-stat-icon">{icon}</div>
            <div className="insight-stat-info">
                <span className="insight-stat-label">{label}</span>
                <span className="insight-stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                <span className={`insight-stat-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '↑' : '↓'} {Math.abs(change)}% this week
                </span>
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="insight-tooltip">
                <p className="insight-tooltip-label">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }}>
                        {p.name}: <strong>{p.value}</strong>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

function StrideInsights() {
    const { t } = useTranslation();
    const { token, user } = useAuth();
    const [overview, setOverview] = useState(null);
    const [topPosts, setTopPosts] = useState([]);
    const [scheduledPosts, setScheduledPosts] = useState([]);
    const [walletData, setWalletData] = useState({ history: [], total: 0 });
    const [activeView, setActiveView] = useState('analytics'); // 'analytics' | 'scheduled' | 'wallet'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const headers = { Authorization: `Bearer ${token}` };
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

                const [ovRes, topRes, schRes, earnRes] = await Promise.all([
                    fetch(`${baseUrl}/api/analytics/overview`, { headers }),
                    fetch(`${baseUrl}/api/analytics/content/top`, { headers }),
                    fetch(`${baseUrl}/api/posts/me/scheduled`, { headers }),
                    fetch(`${baseUrl}/api/monetization/earnings`, { headers })
                ]);

                if (ovRes.ok) setOverview(await ovRes.json());
                if (topRes.ok) setTopPosts(await topRes.json());
                if (schRes.ok) setScheduledPosts(await schRes.json());
                if (earnRes.ok) setWalletData(await earnRes.json());
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchData();
    }, [token]);

    const deleteScheduled = async (id) => {
        if (!window.confirm('Delete this scheduled post?')) return;
        try {
            const res = await fetch(`${config.API_URL}/api/posts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.email })
            });
            if (res.ok) {
                setScheduledPosts(prev => prev.filter(p => p._id !== id));
            }
        } catch (e) { console.error(e); }
    };

    // Audience mock data
    const audienceData = [
        { name: 'USA', value: 35 },
        { name: 'India', value: 28 },
        { name: 'UK', value: 15 },
        { name: 'Brazil', value: 12 },
        { name: 'Other', value: 10 },
    ];

    if (loading) {
        return (
            <div className="insights-page">
                <div className="insights-loading">
                    <div className="insights-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="insights-page">
                <div className="insights-error">
                    <span>⚠️</span>
                    <p>{t('common.error')}</p>
                </div>
            </div>
        );
    }

    const stats = overview || {
        impressions: { value: 0, change: 0 },
        reach: { value: 0, change: 0 },
        engagementRate: { value: 0, change: 0 },
        newFollowers: { value: 0, change: 0 },
        trend: []
    };

    return (
        <div className="insights-page" id="insights-page">
            {/* Header */}
            <div className="insights-header">
                <div className="insights-header-text">
                    <h1 className="insights-title">{t('insights.title')}</h1>
                    <p className="insights-subtitle">{t('insights.subtitle')}</p>
                </div>
                <div className="insights-nav-tabs">
                    <button className={`insight-tab ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>
                        <TrendingUp size={16} /> Analytics
                    </button>
                    <button className={`insight-tab ${activeView === 'scheduled' ? 'active' : ''}`} onClick={() => setActiveView('scheduled')}>
                        <Calendar size={16} /> Scheduled ({scheduledPosts.length})
                    </button>
                    <button className={`insight-tab ${activeView === 'wallet' ? 'active' : ''}`} onClick={() => setActiveView('wallet')}>
                        <Wallet size={16} /> Wallet
                    </button>
                </div>
            </div>

            {activeView === 'analytics' ? (
                <>
                    {/* Summary Cards */}
                    <div className="insights-cards-grid">
                        <StatCard
                            label={t('insights.impressions')}
                            value={stats.impressions.value}
                            change={stats.impressions.change}
                            icon="👁️"
                            color="#8b5cf6"
                        />
                        <StatCard
                            label={t('insights.reach')}
                            value={stats.reach.value}
                            change={stats.reach.change}
                            icon="📡"
                            color="#ec4899"
                        />
                        <StatCard
                            label={t('insights.engagementRate')}
                            value={`${stats.engagementRate.value}%`}
                            change={stats.engagementRate.change}
                            icon="⚡"
                            color="#06b6d4"
                        />
                        <StatCard
                            label={t('insights.newFollowers')}
                            value={stats.newFollowers.value}
                            change={stats.newFollowers.change}
                            icon="🚀"
                            color="#10b981"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="insights-charts-row">
                        {/* Engagement Trend */}
                        <div className="insights-chart-card">
                            <h3 className="insights-chart-title">{t('insights.engagementTrend')}</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={stats.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }}
                                        tickFormatter={d => d ? d.slice(5) : ''} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="likes" name={t('insights.likes')}
                                        stroke="#8b5cf6" fill="url(#colorLikes)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="comments" name={t('insights.comments')}
                                        stroke="#ec4899" fill="url(#colorComments)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Audience Breakdown */}
                        <div className="insights-chart-card">
                            <h3 className="insights-chart-title">{t('insights.audienceBreakdown')}</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={audienceData} cx="50%" cy="45%" innerRadius={55} outerRadius={85}
                                        paddingAngle={4} dataKey="value">
                                        {audienceData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend iconType="circle" iconSize={8}
                                        formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{v}</span>} />
                                    <Tooltip formatter={(v) => `${v}%`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue Row */}
                    <div className="insights-charts-row">
                        <div className="insights-chart-card">
                            <h3 className="insights-chart-title">💰 Revenue Breakdown</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={stats.humanRevenueTrend || [
                                    { name: 'Tips', value: 450 },
                                    { name: 'Subs', value: 820 },
                                    { name: 'Gifts', value: 310 },
                                    { name: 'Ad Rev', value: 120 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="insights-chart-card">
                            <h3 className="insights-chart-title">💎 Top Supporters</h3>
                            <div className="top-supporters-list">
                                {(stats.topSupporters || []).map((supporter, i) => (
                                    <div key={i} className="supporter-row">
                                        <span className="rank">{i + 1}</span>
                                        <img src={supporter.avatar} alt="" className="supporter-avatar" />
                                        <span className="supporter-name">@{supporter.username}</span>
                                        <span className="supporter-tokens">{supporter.tokens} 🪙</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Posts */}
                    <div className="insights-top-posts">
                        <h3 className="insights-chart-title">{t('insights.topPosts')}</h3>
                        <div className="insights-posts-list">
                            {topPosts.slice(0, 5).map((post, idx) => (
                                <div className="insights-post-row" key={post._id}>
                                    <div className="insights-post-rank">#{idx + 1}</div>
                                    <img src={post.contentUrl} alt="" className="insights-post-thumb" />
                                    <div className="insights-post-meta">
                                        <p className="insights-post-caption">{post.caption?.slice(0, 50)}...</p>
                                        <div className="insights-post-stats">
                                            <span>❤️ {post.likesCount}</span>
                                            <span>💬 {post.commentsCount}</span>
                                        </div>
                                    </div>
                                    <div className="insights-post-score">{post.performanceScore}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : activeView === 'scheduled' ? (
                <div className="scheduled-view animate-in">
                    <div className="scheduled-grid">
                        {scheduledPosts.length === 0 ? (
                            <div className="insights-no-data">
                                <Clock size={48} />
                                <p>No scheduled posts yet.</p>
                            </div>
                        ) : (
                            scheduledPosts.map(post => (
                                <div key={post._id} className="scheduled-card glass-card">
                                    <div className="scheduled-media">
                                        {post.type === 'video' ? <Film size={32} /> : <img src={post.contentUrl} alt="" />}
                                        <div className="scheduled-time-badge">
                                            <Clock size={12} /> {new Date(post.scheduledFor).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="scheduled-info">
                                        <p className="scheduled-caption">{post.caption || 'No caption'}</p>
                                        <div className="scheduled-actions">
                                            <button className="sch-action-btn delete" onClick={() => deleteScheduled(post._id)}>
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="wallet-view animate-in">
                    <div className="wallet-overview-card glass-card">
                        <div className="wallet-balance-info">
                            <span className="balance-label">Total Earnings</span>
                            <h2 className="balance-value">{walletData.total.toLocaleString()} 🪙</h2>
                            <p className="balance-estimate">≈ ${(walletData.total * 0.01).toFixed(2)} USD</p>
                        </div>
                        <div className="wallet-actions">
                            <button className="payout-btn pro-btn">Request Payout</button>
                        </div>
                    </div>

                    <h3 className="wallet-subtitle">Recent Transactions</h3>
                    <div className="transactions-list">
                        {walletData.history.length === 0 ? (
                            <div className="insights-no-data">
                                <Wallet size={48} />
                                <p>No transactions found.</p>
                            </div>
                        ) : (
                            walletData.history.map(tx => (
                                <div key={tx._id} className="transaction-item glass-card">
                                    <div className={`tx-icon ${tx.type === 'payout' ? 'outgoing' : 'incoming'}`}>
                                        {tx.type === 'payout' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                    </div>
                                    <div className="tx-details">
                                        <p className="tx-description">{tx.description}</p>
                                        <p className="tx-date">{new Date(tx.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div className={`tx-amount ${tx.type === 'payout' ? 'negative' : 'positive'}`}>
                                        {tx.type === 'payout' ? '-' : '+'}{tx.amount.toLocaleString()} 🪙
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StrideInsights;
