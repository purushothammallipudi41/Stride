import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Headphones, Users, ChevronUp, ChevronDown, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import { useMusic } from '../hooks/useMusic';
import { BASE_URL } from '../utils/api';
import './ArtistDashboard.css';

const ArtistDashboard = () => {
    const { username } = useMusic();
    const navigate = useNavigate();
    const [timeFilter, setTimeFilter] = useState('7D');
    const [stats, setStats] = useState({
        totalPlays: 0,
        totalTips: 0,
        monthlyListeners: 0,
        followers: 0,
        subscribers: 0,
        subscriptionPrice: 50,
        trend: '0%'
    });

    const [recentTips, setRecentTips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!username || username === 'guest') {
            setIsLoading(false);
            return;
        }

        fetch(`${BASE_URL}/api/artist/stats/${username}`)
            .then(res => res.json())
            .then(data => {
                if (data.summary) {
                    setStats(data.summary);
                }
                if (data.recentTransactions) {
                    setRecentTips(data.recentTransactions.map(tx => ({
                        id: tx._id,
                        user: tx.from?.username || 'Supporter',
                        amount: tx.amount || 0,
                        date: tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'Recent'
                    })));
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Dashboard fetch error:", err);
                setIsLoading(false);
            });
    }, [username]);

    // Simple SVG Sparkline Data
    const playData = [30, 45, 35, 60, 50, 85, 70];
    
    if (isLoading) return <div className="flex-center" style={{ height: '80vh' }}><div className="loading-spinner" /></div>;

    return (
        <div className="dashboard-container">
            <PageHeader title={`Artist Dashboard — Welcome back, ${username || 'Artist'}`} hideBack={true} />
            
            <div className="dashboard-back-action-area" style={{ padding: '0 24px', marginTop: '12px', marginBottom: '16px', display: 'flex', gap: '12px' }}>
                <button 
                    className="back-btn-content"
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '14px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '56px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>
            </div>
            
            <div className="dashboard-grid">
                {/* Stats Cards */}
                <div className="stats-card glass-panel">
                    <div className="stats-icon plays"><Headphones size={24} /></div>
                    <div className="stats-info">
                        <span className="stats-label">Total Plays</span>
                        <h2 className="stats-value">{stats.totalPlays != null ? stats.totalPlays.toLocaleString() : '---'}</h2>
                        <span className="stats-trend positive"><ChevronUp size={16} /> {stats.trend || '0%'}</span>
                    </div>
                </div>

                <div className="stats-card glass-panel">
                    <div className="stats-icon revenue"><DollarSign size={24} /></div>
                    <div className="stats-info">
                        <span className="stats-label">Total Earnings</span>
                        <h2 className="stats-value">{stats.totalTips != null ? `$${stats.totalTips.toLocaleString()}` : '$0.00'}</h2>
                        <span className="stats-trend positive"><ChevronUp size={16} /> +0%</span>
                    </div>
                </div>

                <div className="stats-card glass-panel">
                    <div className="stats-icon listeners"><Users size={24} /></div>
                    <div className="stats-info">
                        <span className="stats-label">Monthly Listeners</span>
                        <h2 className="stats-value">{stats.monthlyListeners != null ? stats.monthlyListeners.toLocaleString() : '---'}</h2>
                        <span className="stats-trend positive"><ChevronUp size={16} /> +0%</span>
                    </div>
                </div>

                <div className="stats-card glass-panel subscriber-echo">
                    <div className="stats-icon subscribers"><Headphones size={24} /></div>
                    <div className="stats-info">
                        <span className="stats-label">Subscriber Pulse</span>
                        <h2 className="stats-value">{stats.subscribers != null ? stats.subscribers.toLocaleString() : '0'}</h2>
                        <span className="stats-trend positive">Proj. ${(stats.subscribers * (stats.subscriptionPrice || 50)).toLocaleString()}/mo</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-main-grid">
                {/* Plays Chart */}
                <div className="chart-panel glass-panel">
                    <div className="panel-header">
                        <h3>Plays Overview</h3>
                        <div className="time-filters">
                            <button className={timeFilter === '7D' ? "active" : ""} onClick={() => setTimeFilter('7D')}>7D</button>
                            <button className={timeFilter === '1M' ? "active" : ""} onClick={() => setTimeFilter('1M')}>1M</button>
                            <button className={timeFilter === '1Y' ? "active" : ""} onClick={() => setTimeFilter('1Y')}>1Y</button>
                        </div>
                    </div>
                    <div className="chart-container">
                        <svg viewBox="0 0 400 150" className="plays-chart">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--theme-primary)" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="var(--theme-primary)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path 
                                d={`M 0 150 ${playData.map((d, i) => `L ${(i / (playData.length-1)) * 400} ${150 - d}`).join(' ')} L 400 150 Z`}
                                fill="url(#chartGradient)"
                            />
                            <path 
                                d={playData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i / (playData.length-1)) * 400} ${150 - d}`).join(' ')}
                                fill="none"
                                stroke="var(--theme-primary)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            {/* Chart Points */}
                            {playData.map((d, i) => (
                                <circle 
                                    key={i}
                                    cx={(i / (playData.length-1)) * 400} 
                                    cy={150 - d} 
                                    r="4" 
                                    fill="var(--theme-primary)" 
                                />
                            ))}
                        </svg>
                        <div className="chart-labels">
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                            <span>Sun</span>
                        </div>
                    </div>
                </div>

                {/* Recent Tips */}
                <div className="tips-panel glass-panel">
                    <div className="panel-header">
                        <h3>Recent Tips</h3>
                    </div>
                    <div className="tips-list">
                        {recentTips.map(tip => (
                            <div key={tip.id} className="tip-item">
                                <div className="tip-user-info">
                                    <div className="tip-avatar">{tip.user[0]}</div>
                                    <div>
                                        <div className="tip-username">{tip.user}</div>
                                        <div className="tip-date">{tip.date}</div>
                                    </div>
                                </div>
                                <div className="tip-amount text-gradient">${tip.amount.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                    <button className="view-all-btn" onClick={() => navigate('/wallet')}>View All Transactions</button>
                </div>
            </div>
        </div>
    );
};

export default ArtistDashboard;
