import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, MessageSquare, Landmark, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import config from '../../config';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ serverId }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, [serverId]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${config.API_URL}/api/servers/${serverId}/analytics`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setStats(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="analytics-loading">Analyzing Vibe Data...</div>;
    if (error) return <div className="analytics-error">Error: {error}</div>;

    const StatCard = ({ title, value, icon: Icon, trend, subValue }) => (
        <div className="stat-card">
            <div className="stat-header">
                <div className="stat-icon"><Icon size={20} /></div>
                {trend && (
                    <div className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
                        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}
                    </div>
                )}
            </div>
            <div className="stat-main">
                <span className="stat-value">{value}</span>
                <span className="stat-title">{title}</span>
            </div>
            {subValue && <div className="stat-sub">{subValue}</div>}
        </div>
    );

    return (
        <div className="analytics-dashboard">
            <div className="analytics-header">
                <h2>Server Insights</h2>
                <div className="date-badge"><Calendar size={14} /> Last 30 Days</div>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="Total New Members"
                    value={stats.totalMembers}
                    icon={Users}
                    trend={stats.netGrowth}
                    subValue={`${stats.netGrowth >= 0 ? '+' : ''}${stats.netGrowth} net growth`}
                />
                <StatCard
                    title="Message Volume"
                    value={stats.messageVolume}
                    icon={MessageSquare}
                />
                <StatCard
                    title="Token Revenue"
                    value={`${stats.monetization.tokenRevenue} VT`}
                    icon={Landmark}
                    subValue={`${stats.monetization.subscriptions} new subscriptions`}
                />
            </div>

            <div className="analytics-chart-section">
                <div className="chart-header">
                    <h3><TrendingUp size={18} /> Activity Trend (Messages)</h3>
                </div>
                <div className="simple-bar-chart">
                    {stats.activityTrend.map((day, idx) => {
                        const max = Math.max(...stats.activityTrend.map(d => d.count), 1);
                        const height = (day.count / max) * 100;
                        return (
                            <div key={idx} className="chart-bar-container">
                                <div
                                    className="chart-bar"
                                    style={{ height: `${height}%` }}
                                    title={`${day.date}: ${day.count} messages`}
                                >
                                    <div className="bar-tooltip">{day.count}</div>
                                </div>
                                <span className="chart-label">{day.date.split('-')[2]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
