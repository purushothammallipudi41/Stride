import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Film, MessageCircle, User, Activity, Hash, Plus } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Compass, label: 'Explore', path: '/explore' },
        { icon: Film, label: 'Reels', path: '/reels' },
        { icon: MessageCircle, label: 'Messages', path: '/messages' },
        { icon: Hash, label: 'Servers', path: '/servers' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Activity className="logo-icon" size={32} />
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
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${['Notifications'].includes(item.label) ? 'mobile-hide' : ''}`}
                        >
                            <div style={{ position: 'relative' }}>
                                <item.icon size={24} />
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
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${['Notifications'].includes(item.label) ? 'mobile-hide' : ''}`}
                        >
                            <div style={{ position: 'relative' }}>
                                <item.icon size={24} />
                            </div>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            <div className="sidebar-footer">
                {/* User mini profile or separate settings could go here */}
            </div>
        </aside>
    );
};

export default Sidebar;
