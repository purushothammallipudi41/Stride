import { Home, Compass, MessageCircle, User, Activity, Plus, Bell, Menu, Layout } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUI } from '../../hooks/useUI';
import './Sidebar.css';

const Sidebar = () => {
    const { openCreateModal } = useUI();

    const navItems = [

        { icon: Home, label: 'Home', path: '/' },
        { icon: Compass, label: 'Explore', path: '/explore' },
        { icon: Plus, label: 'Create', action: 'create' },
        { icon: User, label: 'Profile', path: '/profile' },
        { icon: Menu, label: 'More', path: '/more' },
    ];

    const handleItemClick = (e, item) => {
        if (item.action === 'create') {
            e.preventDefault();
            openCreateModal();
        }
    };

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
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.path || '#'}
                        className={({ isActive }) => `nav-item ${item.path && isActive ? 'active' : ''} ${item.action === 'create' ? 'create-nav-item' : ''}`}
                        onClick={(e) => handleItemClick(e, item)}
                    >
                        <div className="nav-icon-wrapper">
                            <item.icon size={24} />
                        </div>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>


            <div className="sidebar-footer">
            </div>
        </aside>
    );
};


export default Sidebar;
