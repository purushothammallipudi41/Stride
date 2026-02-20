import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Music, Film, User, Activity, Hash, Plus, Heart, Globe } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import CreateModal from '../create/CreateModal';
import './Sidebar.css';

const Sidebar = () => {
    const { unreadCount } = useNotifications();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const location = useLocation();

    const isHiddenOnMobile = ['/messages', '/notifications', '/reels', '/servers'].some(path =>
        location.pathname.startsWith(path)
    );

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Music, label: 'Explore', path: '/explore' },
        { icon: Film, label: 'Reels', path: '/reels' },

        { icon: Globe, label: 'Servers', path: '/servers' },
        { icon: User, label: 'Profile', path: '/profile' },
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
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.label === 'Notifications' ? 'mobile-hide' : ''}`}
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
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.label === 'Notifications' ? 'mobile-hide' : ''}`}
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
                </div>
            </aside>

            <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        </>
    );
};

export default Sidebar;
