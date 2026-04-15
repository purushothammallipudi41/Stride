import { Home, Search, Plus, MoreHorizontal } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUI } from '../../hooks/useUI';
import { useTranslation } from 'react-i18next';
import { getStoredUser } from '../../utils/storage';
import Avatar from '../common/Avatar';
import logo from '../../assets/stride-logo.png';
import './Sidebar.css';

const Sidebar = () => {
    const { openCreateModal, openExplorer } = useUI();
    const { t } = useTranslation();
    const user = getStoredUser();

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
                    const isAvatar = item.icon === 'avatar';

                    const NavIcon = ({ isActive }) => {
                        if (isAvatar) {
                            return (
                                <div className={`nav-avatar-wrapper ${isActive ? 'active-avatar' : ''}`}>
                                    <Avatar 
                                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.username || '?'}&background=random&color=fff`} 
                                        size={28} 
                                    />
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

                        return (
                            <button
                                key={item.label}
                                className="nav-item create-btn-premium"
                                onClick={openCreateModal}
                                aria-label={item.label}
                            >
                                <div className="create-icon-wrapper">
                                    <Plus size={32} strokeWidth={3} />
                                </div>
                            </button>
                        );

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
                <div className="version-tag animate-pulse-purple" style={{ 
                    fontSize: '10px', 
                    padding: '10px', 
                    textAlign: 'center', 
                    fontWeight: '900',
                    color: '#8b5cf6',
                    textShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
                }}>v1.2.5-ULTIMATE</div>
            </div>
        </aside>
    );
};


export default Sidebar;
