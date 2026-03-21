import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Globe, BookOpen, Film, Music2, Hash, Settings, Layout, Plus, LogOut, LogIn } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useUI } from '../hooks/useUI';
import './More.css';

const More = () => {
    const navigate = useNavigate();
    const { openCreateModal } = useUI();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    const menuItems = [
        { icon: Compass, title: 'Discover', desc: 'Discover new artists and trends', path: '/explore', color: '#8b5cf6' },
        { icon: Layout, title: 'Artist Dashboard', desc: 'Manage your music and career', path: '/artist-dashboard', color: '#10b981' },
        { icon: Plus, title: 'Create Post', desc: 'Share your latest beats or thoughts', action: 'create', color: '#f59e0b' },
        { icon: Globe, title: 'Communities', desc: 'Join groups of like-minded fans', path: '/communities/discover', color: '#ec4899' },
        { icon: BookOpen, title: 'Articles', desc: 'Read the latest music news', path: '/articles', color: '#10b981' },
        { icon: Film, title: 'Reels', desc: 'Watch short-form video content', path: '/reels', color: '#f59e0b' },
        { icon: Music2, title: 'Music', desc: 'Listen to your personalized feed', path: '/music', color: '#3b82f6' },
        { icon: Hash, title: 'Servers', desc: 'Jump into live audio spaces', path: '/servers', color: '#6366f1' },
        { icon: Settings, title: 'Settings', desc: 'Manage your app preferences', path: '/profile?edit=true', color: '#a855f7' },
        isAuthenticated ? 
        { icon: LogOut, title: 'Logout', desc: 'Sign out of your account', action: 'logout', color: '#ef4444' } :
        { icon: LogIn, title: 'Login', desc: 'Sign in to your account', path: '/login', color: '#8b5cf6' }
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
                        <img src={user.avatar} alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
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
                        className="more-card glass-card"
                        onClick={() => handleItemClick(item)}
                    >
                        <div className="more-icon-wrapper" style={{ '--icon-color': item.color }}>
                            <item.icon size={32} />
                        </div>
                        <div className="more-info">
                            <h3>{item.title}</h3>
                            <p>{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
            </div>
        </>
    );
};

export default More;
