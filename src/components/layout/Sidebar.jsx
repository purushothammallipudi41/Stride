import { Home, Compass, Plus, User, Layout } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUI } from '../../hooks/useUI';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/stride-logo.png';
import './Sidebar.css';

const Sidebar = () => {
    const { openCreateModal, openExplorer } = useUI();
    const { t } = useTranslation();


    const navItems = [
        { icon: Home, label: t('nav.home'), path: '/' },
        { icon: Compass, label: t('nav.explore'), path: '/explore' },
        { icon: Plus, label: t('nav.create'), action: 'create' },
        { icon: User, label: t('nav.profile'), path: '/profile' },
        { icon: Layout, label: t('common.more'), action: 'explore' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <img src={logo} alt="Stride" className="logo-image-sidebar" />
                <div className="logo-container">
                    <h1 className="logo-text">{t('common.stride')}</h1>
                    <span className="slogan-text">{t('common.find_your_rhythm')}</span>
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
                                aria-label={item.label}
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
                                aria-label={item.label}
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
                            aria-label={item.label}
                        >
                            {linkContent}
                        </NavLink>
                    );
                })}
            </nav>


            <div className="sidebar-footer">
                <div className="version-tag animate-pulse-purple" style={{ fontSize: '10px', padding: '10px', textAlign: 'center', fontWeight: '800' }}>v1.2.3-LIVE</div>
            </div>
        </aside>
    );
};


export default Sidebar;
