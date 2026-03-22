import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Globe, BookOpen, Film, Music2, Hash, Settings, Layout, Plus, LogOut, LogIn } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Avatar from '../components/common/Avatar';
import { useUI } from '../hooks/useUI';
import './More.css';

const More = () => {
    const navigate = useNavigate();
    const { openCreateModal } = useUI();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    const menuItems = [
        { icon: Layout, title: 'Artist Dashboard', desc: 'Central hub for music management', path: '/artist-dashboard', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
        { icon: Globe, title: 'Communities', desc: 'Connect with like-minded fans', path: '/communities/discover', color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' },
        { icon: BookOpen, title: 'Articles', desc: 'Latest news and industry insights', path: '/articles', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
        { icon: Film, title: 'Reels', desc: 'Short-form immersive video', path: '/reels', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
        { icon: Music2, title: 'Music', desc: 'Your personalized soundscape', path: '/music', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
        { icon: Hash, title: 'Servers', desc: 'Live audio rooms and chat', path: '/servers', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
        { icon: Settings, title: 'Settings', desc: 'Tailor your Stride experience', path: '/settings', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' },
        { icon: Settings, title: 'Settings', desc: 'Manage your app preferences', path: '/settings', color: '#a855f7' },
        isAuthenticated ? 
        { icon: LogOut, title: 'Logout', desc: 'Securely exit your session', action: 'logout', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' } :
        { icon: LogIn, title: 'Login', desc: 'Access your global profile', path: '/login', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }
    ];

    const handleItemClick = (item) => {
        if (item.action === 'create') {
            openCreateModal();
        } else if (item.action === 'logout') {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('isAuthenticated');
            navigate('/login');
        } else if (item.path) {
            navigate(item.path);
        }
    };




    return (
        <>
            <PageHeader title="Menu" />
            <div className="more-page animate-fade-in" style={{ paddingTop: '20px' }}>
                {user && (
                    <div className="user-welcome glass-card" style={{ margin: '0 20px 24px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Avatar 
                            src={user.avatar} 
                            alt="Avatar" 
                            size={48} 
                            frame={user.avatarFrame || 'none'}
                        />
                        <div>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Welcome back, {user.name || user.username}!</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>{user.email}</p>
                        </div>
                    </div>
                )}
                <div className="more-grid">
                    {menuItems.map((item, index) => (
                        <div 
                            key={index} 
                            className="more-card-premium"
                            onClick={() => handleItemClick(item)}
                            style={{ '--accent-color': item.color, '--item-gradient': item.gradient }}
                        >
                            <div className="card-glow"></div>
                            <div className="card-content">
                                <div className="more-icon-wrapper-premium">
                                    <item.icon size={32} />
                                </div>
                                <div className="more-info-premium">
                                    <h3>{item.title}</h3>
                                    <p>{item.desc}</p>
                                </div>
                            </div>
                            <div className="card-arrow">
                                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default More;
