import { Home, Search, Plus, MoreHorizontal, Play, Camera, Gavel, User as UserIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUI } from '../../hooks/useUI';
import { useTranslation } from 'react-i18next';
import { getStoredUser } from '../../utils/storage';
import Avatar from '../common/Avatar';
import logo from '../../assets/vyx-logo.png';
import './Sidebar.css';

const Sidebar = () => {
    const { openCreateModal, openExplorer } = useUI();
    const { t } = useTranslation();
    const [user, setUser] = useState(getStoredUser());
    const location = useLocation();
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    useEffect(() => {
        const handleAuthUpdate = () => {
            setUser(getStoredUser());
        };
        window.addEventListener('vyx_auth_update', handleAuthUpdate);
        return () => window.removeEventListener('vyx_auth_update', handleAuthUpdate);
    }, []);

    const navItems = [
        { icon: Home, label: t('nav.home'), path: '/' },
        { icon: Search, label: t('nav.explore'), path: '/explore' },
        { icon: Plus, label: t('nav.create'), action: 'create' },
        { icon: 'avatar', label: t('nav.profile'), path: '/profile' },
        { icon: MoreHorizontal, label: t('common.more'), action: 'explore' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <img src={logo} alt="Vyx" className="logo-image-sidebar" />
                <div className="logo-container">
                    <h1 className="logo-text">{t('common.vyx')}</h1>
                    <span className="slogan-text">{t('common.find_your_frequency')}</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                 {navItems.map((item) => {
                    const isCreate = item.action === 'create';
                    const isExplore = item.action === 'explore';
                    const isAvatar = item.icon === 'avatar';

                    const NavIcon = ({ isActive }) => {
                        if (isAvatar) {
                            return (
                                <div className={`nav-avatar-wrapper ${isActive ? 'active-avatar' : ''}`}>
                                    {user?.avatar ? (
                                        <Avatar 
                                            src={user.avatar} 
                                            alt={user.username || "User"}
                                            size={28} 
                                            hideInitial={true}
                                        />
                                    ) : (
                                        <UserIcon size={24} strokeWidth={isActive ? 2.8 : 2.5} />
                                    )}
                                </div>
                            );
                        }
                        return <item.icon size={26} strokeWidth={isActive ? 2.8 : 2.5} fill={isActive && !isCreate ? 'currentColor' : 'none'} />;
                    };

                    const linkContent = (isActive) => (
                        <>
                            <div className="nav-icon-wrapper">
                                <NavIcon isActive={isActive} />
                            </div>
                            <span className="nav-label">{item.label}</span>
                        </>
                    );

                    if (isCreate) {
                        return (
                            <button
                                key={item.label}
                                className="nav-item create-btn-premium"
                                onClick={() => openCreateModal('POST')}
                                aria-label={item.label}
                            >
                                <div className="create-icon-wrapper">
                                    <Plus size={24} strokeWidth={2.5} />
                                </div>
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
                                {linkContent(false)}
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
                            {({ isActive }) => linkContent(isActive)}
                        </NavLink>
                    );
                })}
            </nav>
            <div className="sidebar-footer">
                <div className="version-tag animate-pulse-cobalt" style={{ 
                    fontSize: '10px', 
                    padding: '10px', 
                    textAlign: 'center', 
                    fontWeight: '900',
                    color: '#0066ff',
                    textShadow: '0 0 10px rgba(0, 102, 255, 0.5)'
                }}>v2.0.0-GENESIS</div>
            </div>
        </aside>
    );
};


export default Sidebar;
