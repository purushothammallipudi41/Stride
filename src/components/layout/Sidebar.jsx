import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Music, Film, User, Activity, Hash, Plus, Heart, Globe, Compass, Users, Mic2, BarChart2, Trophy } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import StreakBadge from '../common/StreakBadge';
import UserAvatar from '../common/UserAvatar';
import CreateModal from '../create/CreateModal';
import './Sidebar.css';

const Sidebar = () => {
    const { unreadCount } = useNotifications();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const location = useLocation();

    const isHiddenOnMobile = ['/messages', '/notifications', '/reels', '/servers'].some(path =>
        location.pathname.startsWith(path)
    );

    const navItems = [
        { icon: Home, label: 'Home', path: '/', mobileHide: false },
        { icon: Music, label: 'Explore', path: '/explore', mobileHide: false },
        { icon: Film, label: 'Reels', path: '/reels', mobileHide: true },
        { icon: Mic2, label: 'Spaces', path: '/spaces', mobileHide: true },
        { icon: Globe, label: 'Articles', path: '/articles', mobileHide: true },
        { icon: Users, label: 'Communities', path: '/servers/explore', mobileHide: false },
        { icon: User, label: 'Profile', path: '/profile', mobileHide: false },
    ];

    return (
        <>
            <aside className={`sidebar ${isHiddenOnMobile ? 'mobile-hide-forced' : ''}`}>
                <div className="sidebar-header">
                    <img src="/logo.png" alt="Stride Logo" className="logo-icon" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    <div className="logo-container">
                        <h1 className="logo-text">Stride</h1>
                        <span className="slogan-text">Find your rhythm</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-group top">
                        {navItems.slice(0, 3).map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.label === 'Notifications' || item.mobileHide ? 'mobile-hide' : ''}`}
                            >
                                <div style={{ position: 'relative' }}>
                                    <item.icon size={24} />
                                    {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                                </div>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>

                    <button
                        className="nav-item create-btn"
                        onClick={() => setIsCreateOpen(true)}
                        title="Create"
                    >
                        <div className="create-icon-wrapper">
                            <Plus size={24} />
                        </div>
                        <span className="nav-label">Create</span>
                    </button>

                    <div className="nav-group bottom">
                        {navItems.slice(3).map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.label === 'Notifications' || item.mobileHide ? 'mobile-hide' : ''}`}
                            >
                                <div style={{ position: 'relative' }}>
                                    <item.icon size={24} />
                                    {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                                </div>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    {user && (
                        <div className="user-profile-summary" onClick={() => navigate('/profile')}>
                            <UserAvatar user={user} size="sm" />
                            <div className="user-details">
                                <span className="user-name">{user.name || user.username}</span>
                                <span className="user-handle">@{user.username}</span>
                            </div>
                            <StreakBadge size="sm" />
                        </div>
                    )}
                </div>
            </aside>

            <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        </>
    );
};

export default Sidebar;
