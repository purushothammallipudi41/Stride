import { Home, Compass, MessageCircle, User, Activity, Plus, Bell, Menu, Layout } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUI } from '../../hooks/useUI';
import './Sidebar.css';

const Sidebar = () => {
    const { openCreateModal, openExplorer } = useUI();

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Compass, label: 'Explore', path: '/explore' },
        { icon: Plus, label: 'Create', action: 'create' },
        { icon: User, label: 'Profile', path: '/profile' },
        { icon: Menu, label: 'More', action: 'explore' },
    ];

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
                {navItems.map((item) => {
                    const isCreate = item.action === 'create';
                    const isExplore = item.action === 'explore';
                    const linkContent = (
                        <>
                            <div className="nav-icon-wrapper">
                                <item.icon size={24} />
                            </div>
                            <span className="nav-label">{item.label}</span>
                        </>
                    );

                    if (isCreate) {
                        return (
                            <button
                                key={item.label}
                                className="nav-item create-btn"
                                onClick={openCreateModal}
                            >
                                {linkContent}
                            </button>
                        );
                    }

                    if (isExplore) {
                        return (
                            <button
                                key={item.label}
                                className="nav-item"
                                onClick={openExplorer}
                            >
                                {linkContent}
                            </button>
                        );
                    }

                    return (
                        <NavLink
                            key={item.label}
                            to={item.path || '#'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            {linkContent}
                        </NavLink>
                    );
                })}
            </nav>


            <div className="sidebar-footer">
            </div>
        </aside>
    );
};


export default Sidebar;
