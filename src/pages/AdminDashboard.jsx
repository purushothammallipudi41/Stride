import React, { useState, useEffect } from 'react';
import { 
    Shield, Users, MessageSquare, Tool, Activity, 
    Check, X, AlertCircle, RefreshCw, LogOut, ChevronRight
} from 'lucide-react';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import { hapticNotification } from '../utils/haptics';
import { NotificationType } from '@capacitor/haptics';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ users: 0, revenue: 0, reports: 0, verifications: 0 });
    const [reports, setReports] = useState([]);
    const [verifications, setVerifications] = useState([]);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const currentUser = getStoredUser();

    useEffect(() => {
        // Fetch Admin Data
        const fetchData = async () => {
            try {
                // Fetch Stats
                const statsRes = await fetch(`${BASE_URL}/api/admin/stats`);
                const statsData = await statsRes.json();
                setStats(statsData);
                
                // Fetch Reports
                const reportsRes = await fetch(`${BASE_URL}/api/admin/reports`);
                const reportsData = await reportsRes.json();
                setReports(reportsData);
                
                // Fetch Verifications
                const verificationsRes = await fetch(`${BASE_URL}/api/admin/verifications`);
                const verificationsData = await verificationsRes.json();
                setVerifications(verificationsData);

                // Check maintenance status
                const configRes = await fetch(`${BASE_URL}/api/system/config`);
                const configData = await configRes.json();
                setIsMaintenance(configData.maintenance);

                setIsLoading(false);
            } catch (err) {
                console.error("Admin fetch failed", err);
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleMaintenance = async () => {
        const nextState = !isMaintenance;
        setIsMaintenance(nextState);
        hapticNotification(NotificationType.Warning);
        // In production, this would call a PATCH /api/system/config
        console.log(`[ADMIN] Maintenance toggled to: ${nextState}`);
    };

    const approveVerification = (id) => {
        setVerifications(prev => prev.filter(v => v.id !== id));
        setStats(prev => ({ ...prev, verifications: prev.verifications - 1 }));
        hapticNotification(NotificationType.Success);
    };

    if (currentUser?.username !== 'puru' && currentUser?.username !== 'admin') {
        return (
            <div className="admin-restricted">
                <Shield size={60} color="#ef4444" />
                <h1>Access Restricted</h1>
                <p>This command center is reserved for Stride Sovereigns.</p>
                <button onClick={() => window.location.href='/'}>Return to Frequencies</button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-container animate-fade-in">
            <aside className="admin-sidebar glass-panel">
                <div className="admin-brand">
                    <Shield size={24} color="var(--theme-primary)" />
                    <span>Stride Admin</span>
                </div>
                <nav className="admin-nav">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><Activity size={18}/> Overview</button>
                    <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}><Users size={18}/> Verifications ({stats.verifications})</button>
                    <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}><MessageSquare size={18}/> Reports ({stats.reports})</button>
                    <button className={activeTab === 'system' ? 'active' : ''} onClick={() => setActiveTab('system')}><Tool size={18}/> System Control</button>
                </nav>
                <div className="admin-footer">
                    <button className="admin-logout" onClick={() => window.location.href='/'}><LogOut size={18}/> Exit Control</button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                    <div className="admin-user-tag">
                        <div className="status-dot online"></div>
                        <span>Logged in as <strong>{currentUser.username}</strong></span>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div className="admin-content animate-slide-up">
                        <div className="admin-stats-grid">
                            <div className="stat-card glass-panel">
                                <span className="stat-label">Total Users</span>
                                <span className="stat-value">{stats.users}</span>
                                <span className="stat-delta positive">+12% this week</span>
                            </div>
                            <div className="stat-card glass-panel">
                                <span className="stat-label">Revenue (USD)</span>
                                <span className="stat-value">${stats.revenue}</span>
                                <span className="stat-delta positive">+$840 today</span>
                            </div>
                            <div className="stat-card glass-panel">
                                <span className="stat-label">Active Frequencies</span>
                                <span className="stat-value">42</span>
                                <span className="stat-delta">Healthy</span>
                            </div>
                        </div>

                        <div className="admin-section-header">
                            <h3>Live System Status</h3>
                        </div>
                        <div className="system-status-banner glass-panel">
                            <div className={`status-indicator ${isMaintenance ? 'warning' : 'healthy'}`}></div>
                            <div className="status-info">
                                <h4>{isMaintenance ? 'Maintenance Mode Active' : 'System Operational'}</h4>
                                <p>{isMaintenance ? 'Users are currently blocked from main app features.' : 'All systems reporting healthy status.'}</p>
                            </div>
                            <button className={`maintenance-toggle ${isMaintenance ? 'active' : ''}`} onClick={toggleMaintenance}>
                                {isMaintenance ? 'Disable Maintenance' : 'Enable Maintenance'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="admin-content animate-slide-up">
                        <div className="data-table glass-panel">
                            <div className="table-header">
                                <span>Pending Artist Verifications</span>
                            </div>
                            {verifications.map(v => (
                                <div key={v.id} className="table-row">
                                    <div className="row-info">
                                        <span className="row-title">@{v.username}</span>
                                        <span className="row-subtitle">{v.name} • {v.bio}</span>
                                    </div>
                                    <div className="row-actions">
                                        <button className="action-btn reject"><X size={16}/></button>
                                        <button className="action-btn approve" onClick={() => approveVerification(v.id)}><Check size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            {verifications.length === 0 && <div className="empty-state">No pending verifications.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="admin-content animate-slide-up">
                        <div className="reports-list">
                            {reports.map(r => (
                                <div key={r.id} className="report-card glass-panel">
                                    <div className="report-header">
                                        <span className={`report-badge ${r.type}`}>{r.type}</span>
                                        <span className="report-time">{r.timestamp}</span>
                                    </div>
                                    <p className="report-msg">"{r.message}"</p>
                                    <div className="report-footer">
                                        <span>Reported by <strong>@{r.username}</strong></span>
                                        <button className="report-action">View Context <ChevronRight size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
