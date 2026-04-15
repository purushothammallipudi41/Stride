import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';

const Insights = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('performance');
    const [statsData, setStatsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const user = getStoredUser();
    const username = user?.username || 'guest';

    useEffect(() => {
        fetch(`${BASE_URL}/api/artist/stats/${username}`)
            .then(res => res.json())
            .then(data => {
                setStatsData(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch stats:", err);
                setIsLoading(false);
            });
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
            <header className="insights-header">
                <button className="back-btn-icon" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <div className="title-group">
                    <h1>Analytics & Insights</h1>
                    <p>Deep dive into your content performance and audience reach.</p>
                </div>
            </header>

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
                    {stats.map((stat, idx) => (
                        <div key={idx} className="stat-card glass-panel">
                            <div className="stat-header">
                                <span className="stat-label">{stat.label}</span>
                                <div className="stat-icon-wrapper" style={{ color: stat.color, background: `${stat.color}15` }}>
                                    <stat.icon size={20} />
                                </div>
                            </div>
                            <div className="stat-value">{stat.value}</div>
                            <div className={`stat-change ${stat.positive ? 'positive' : ''}`}>
                                <TrendingUp size={14} /> {stat.change}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="chart-section glass-panel">
                    <div className="chart-header">
                        <h3>Engagement History</h3>
                    </div>
                    {statsData?.stats?.length > 0 ? (
                        <div className="chart-container-v2">
                            <div className="bar-chart-v2">
                                {statsData.stats.slice(0, 7).map((track, i) => {
                                    const maxVal = Math.max(...statsData.stats.map(s => s.listens || 1));
                                    const height = ((track.listens || 0) / maxVal) * 100;
                                    return (
                                        <div key={i} className="bar-wrapper">
                                            <div className="bar-value">{(track.listens || 0)}</div>
                                            <div className="bar-pill" style={{ height: `${Math.max(height, 5)}%` }}>
                                                <div className="bar-glow" />
                                            </div>
                                            <div className="bar-label">{track.trackId?.substring(0, 6)}</div>
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
                                <BarChart3 size={40} className="opacity-10 mb-2" />
                                <p>No engagement data yet</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Insights;
