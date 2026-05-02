import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Eye, Satellite, Zap, Calendar, Wallet, BarChart3 } from 'lucide-react';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import PageHeader from '../components/layout/PageHeader';
import './Insights.css';

const Insights = () => {
    const [activeTab, setActiveTab] = useState('performance');
    const [statsData, setStatsData] = useState(null);

    const userProfile = getStoredUser();
    const username = userProfile?.username || 'guest';

    useEffect(() => {
        if (username && username !== 'guest') {
            fetch(`${BASE_URL}/api/artist/stats/${username}`)
                .then(res => res.json())
                .then(data => {
                    setStatsData(data);
                })
                .catch(err => {
                    console.error("Failed to fetch stats:", err);
                });
        }
    }, [username]);

    const stats = [
        { 
            label: 'IMPRESSIONS', 
            value: statsData?.summary?.totalPlays?.toLocaleString() || '0', 
            change: statsData?.summary?.trend || '0% this week', 
            icon: Eye, 
            color: '#3b82f6' 
        },
        { 
            label: 'TOTAL REACH', 
            value: statsData?.summary?.monthlyListeners?.toLocaleString() || '0', 
            change: '+2.4% this week', 
            icon: Satellite, 
            color: '#a855f7' 
        },
        { 
            label: 'FOLLOWERS', 
            value: statsData?.summary?.followers?.toLocaleString() || '0', 
            change: '+12 this week', 
            icon: Zap, 
            color: '#eab308' 
        },
        { 
            label: 'ZAPS RECEIVED', 
            value: statsData?.summary?.totalTips?.toLocaleString() || '0', 
            change: '+8.4% this week', 
            icon: Zap, 
            color: '#ec4899', 
            positive: true 
        },
    ];

    return (
        <div className="insights-container animate-fade-in">
            <div className="stride-mesh-bg" />
            <PageHeader title="Analytics & Insights" />
            
            <div className="insights-header-subtitle">
                <p>Deep dive into your content performance and audience reach.</p>
            </div>

            <nav className="insights-tabs">
                <div className="tabs-wrapper">
                    <button 
                        className={`insight-tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('performance')}
                    >
                        <TrendingUp size={16} /> Performance
                    </button>
                    <button 
                        className={`insight-tab-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
                        onClick={() => setActiveTab('scheduled')}
                    >
                        <Calendar size={16} /> Scheduled (0)
                    </button>
                    <button 
                        className={`insight-tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
                        onClick={() => setActiveTab('wallet')}
                    >
                        <Wallet size={16} /> Wallet
                    </button>
                </div>
            </nav>

            <main className="insights-content">
                <div className="stats-grid">
                    {activeTab === 'performance' && stats.map((stat, idx) => (
                        <div key={idx} className="stat-card glass-panel">
                            <div className="stat-header">
                                <span className="stat-label">{stat.label}</span>
                                <div className="stat-icon-wrapper" style={{ 
                                    color: stat.color, 
                                    background: `${stat.color}15`,
                                    boxShadow: `0 0 15px ${stat.color}30` 
                                }}>
                                    <stat.icon size={20} />
                                </div>
                            </div>
                            <div className="stat-value">{stat.value}</div>
                            <div className={`stat-change ${stat.positive ? 'positive' : ''}`}>
                                <TrendingUp size={14} /> {stat.change}
                            </div>
                        </div>
                    ))}

                    {activeTab === 'wallet' && (
                        <div className="wallet-insights-wrapper glass-panel animate-fade-in" style={{gridColumn: '1 / -1', padding: '24px'}}>
                            <h3>Recent Income Transactions</h3>
                            <div className="tx-list" style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                {statsData?.recentTransactions?.length > 0 ? (
                                    statsData.recentTransactions.map((tx, i) => (
                                        <div key={i} className="tx-item" style={{display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
                                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                                <span style={{fontWeight: 600}}>{tx.description}</span>
                                                <span style={{fontSize: '0.8rem', opacity: 0.5}}>{new Date(tx.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <span style={{color: '#10b981', fontWeight: 700}}>+{tx.amount}¢</span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{textAlign: 'center', opacity: 0.5, padding: '40px'}}>No recent earnings found.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === 'performance' && (
                    <div className="chart-section glass-panel">
                        <div className="chart-header">
                            <div className="header-info">
                                <h3>Engagement History</h3>
                                <p>Activity across your latest content</p>
                            </div>
                            <BarChart3 className="header-icon" size={24} />
                        </div>
                        {statsData?.stats?.length > 0 ? (
                            <div className="chart-container-v2">
                                <div className="bar-chart-v2">
                                    {statsData.stats.slice(0, 7).map((track, i) => {
                                        const maxVal = Math.max(...statsData.stats.map(s => s.listens || 1));
                                        const height = ((track.listens || 0) / maxVal) * 100;
                                        return (
                                            <div key={i} className="bar-wrapper" style={{ animationDelay: `${i * 0.1}s` }}>
                                                <div className="bar-value">{(track.listens || 0)}</div>
                                                <div className="bar-pill" style={{ height: `${Math.max(height, 8)}%` }}>
                                                    <div className="bar-glow" />
                                                    <div className="bar-shimmer" />
                                                </div>
                                                <div className="bar-label">{track.trackId?.substring(0, 10)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="chart-placeholder">
                                <div className="chart-lines">
                                    {[...Array(5)].map((_, i) => <div key={i} className="chart-line" />)}
                                </div>
                                <div className="empty-chart-msg">
                                    <BarChart3 size={48} className="empty-icon-pulse" />
                                    <p>Scanning for frequencies...</p>
                                    <span className="empty-subtext">Content interaction data will appear here.</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Insights;
