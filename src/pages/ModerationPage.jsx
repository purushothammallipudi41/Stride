import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Shield, Users, MessageSquare, AlertTriangle,
    Gavel, UserX, Clock, ChevronRight, Search,
    Lock, Unlock, Filter, Settings, Trash2, Eye
} from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import './ModerationPage.css';

const ModerationPage = () => {
    const { serverId } = useParams();
    const navigate = useNavigate();
    const { servers } = useServer();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('overview');
    const [auditLogs, setAuditLogs] = useState([]);
    const [bannedUsers, setBannedUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [server, setServer] = useState(null);

    useEffect(() => {
        const currentServer = servers.find(s => s.id === parseInt(serverId));
        if (currentServer) {
            setServer(currentServer);
            // In a real app, we would check permissions here
            // If not admin/mod, redirect
        }
    }, [serverId, servers]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModData = async () => {
            try {
                setLoading(true);
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const reportsRes = await fetch(`${baseUrl}/api/moderation/reports`);
                if (reportsRes.ok) {
                    setReports(await reportsRes.json());
                }

                // Temporary fallback if no real data yet
                setAuditLogs([
                    { id: 1, user: 'Admin', action: 'System Sync', target: 'Environment', time: 'Just now' }
                ]);
            } catch (err) {
                console.error("Failed to fetch moderation data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (serverId) fetchModData();
    }, [serverId]);

    const handleAction = async (reportId, action) => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            let status = 'reviewed';
            let actionTaken = 'none';

            if (action === 'dismiss') {
                status = 'dismissed';
                actionTaken = 'none';
            } else if (action === 'delete') {
                status = 'resolved';
                actionTaken = 'content_deleted';
            } else if (action === 'warn') {
                status = 'resolved';
                actionTaken = 'user_warned';
            }

            const res = await fetch(`${config.API_URL}/api/moderation/reports/${reportId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, actionTaken })
            });

            if (res.ok) {
                setReports(prev => prev.filter(r => r._id !== reportId && r.id !== reportId));
            }
        } catch (error) {
            console.error('Moderation action failed:', error);
        }
    };

    if (!server) return <div className="moderation-page glass-blur">Loading...</div>;

    return (
        <div className="moderation-page animate-fade-in">
            <header className="mod-header glass-card">
                <div className="mod-header-left">
                    <Shield className="mod-icon" size={24} />
                    <div className="mod-title">
                        <h1>Moderation Center</h1>
                        <p>{server.name} • Admin Rights Active</p>
                    </div>
                </div>
                <button className="back-btn" onClick={() => navigate(`/servers/${serverId}`)}>
                    Back to Server
                </button>
            </header>

            <div className="mod-container">
                <aside className="mod-sidebar glass-card">
                    <nav className="mod-nav">
                        <button
                            className={`mod-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <Settings size={18} />
                            <span>Overview</span>
                        </button>
                        <button
                            className={`mod-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('logs')}
                        >
                            <Clock size={18} />
                            <span>Audit Logs</span>
                        </button>
                        <button
                            className={`mod-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reports')}
                        >
                            <AlertTriangle size={18} />
                            <span>Reports</span>
                            {reports.filter(r => r.status === 'Pending').length > 0 &&
                                <span className="mod-badge">{reports.filter(r => r.status === 'Pending').length}</span>
                            }
                        </button>
                        <button
                            className={`mod-nav-item ${activeTab === 'bans' ? 'active' : ''}`}
                            onClick={() => setActiveTab('bans')}
                        >
                            <UserX size={18} />
                            <span>Banned Users</span>
                        </button>
                    </nav>
                </aside>

                <main className="mod-content glass-card">
                    {activeTab === 'overview' && (
                        <div className="mod-section animate-slide-up">
                            <h2>Server Safety Settings</h2>
                            <div className="safety-grid">
                                <div className="safety-card">
                                    <div className="safety-info">
                                        <Shield size={20} />
                                        <div>
                                            <h4>Verification Level</h4>
                                            <p>Members must have a verified email</p>
                                        </div>
                                    </div>
                                    <button className="toggle-btn active">High</button>
                                </div>
                                <div className="safety-card">
                                    <div className="safety-info">
                                        <Filter size={20} />
                                        <div>
                                            <h4>Explicit Content Filter</h4>
                                            <p>Scan and delete inappropriate media</p>
                                        </div>
                                    </div>
                                    <button className="toggle-btn active">Enabled</button>
                                </div>
                                <div className="safety-card">
                                    <div className="safety-info">
                                        <Lock size={20} />
                                        <div>
                                            <h4>Private Server</h4>
                                            <p>Users need an invite link to join</p>
                                        </div>
                                    </div>
                                    <button className="toggle-btn">Disabled</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="mod-section animate-slide-up">
                            <div className="section-header">
                                <h2>Audit Logs</h2>
                                <div className="search-bar-sm">
                                    <Search size={14} />
                                    <input type="text" placeholder="Filter logs..." />
                                </div>
                            </div>
                            <div className="logs-list">
                                {auditLogs.map(log => (
                                    <div key={log.id} className="log-item">
                                        <div className="log-user">{log.user}</div>
                                        <div className="log-action">{log.action}: <strong>{log.target}</strong></div>
                                        <div className="log-time">{log.time}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="mod-section animate-slide-up">
                            <h2>User Reports</h2>
                            <div className="reports-table">
                                <div className="table-header">
                                    <span>Reporter</span>
                                    <span>Reported</span>
                                    <span>Reason</span>
                                    <span>Status</span>
                                    <span>Action</span>
                                </div>
                                {reports.map(report => (
                                    <div key={report.id} className="table-row">
                                        <span>{report.reporter}</span>
                                        <span className="reported-name">{report.reported}</span>
                                        <span>{report.reason}</span>
                                        <span className={`status-pill ${report.status.toLowerCase()}`}>{report.status}</span>
                                        <div className="table-actions">
                                            <button className="icon-btn" title="Dismiss" onClick={() => handleAction(report._id || report.id, 'dismiss')}><Eye size={16} /></button>
                                            <button className="icon-btn warning" title="Warn User" onClick={() => handleAction(report._id || report.id, 'warn')}><AlertTriangle size={16} /></button>
                                            <button className="icon-btn danger" title="Delete Content" onClick={() => handleAction(report._id || report.id, 'delete')}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'bans' && (
                        <div className="mod-section animate-slide-up">
                            <div className="section-header">
                                <h2>Banned Users</h2>
                                <button className="add-ban-btn">Ban User by ID</button>
                            </div>
                            <div className="bans-list">
                                {bannedUsers.map(ban => (
                                    <div key={ban.id} className="ban-item">
                                        <div className="ban-info">
                                            <strong>{ban.user}</strong>
                                            <span>Banned on {ban.date}</span>
                                            <p>{ban.reason}</p>
                                        </div>
                                        <button className="unban-btn">Unban</button>
                                    </div>
                                ))}
                                {bannedUsers.length === 0 && <p className="empty-msg">No banned users found.</p>}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ModerationPage;
