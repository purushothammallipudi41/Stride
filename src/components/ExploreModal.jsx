import { X, Sparkles, Film, Radio, Globe, Users, Trophy, BarChart3, ShoppingBag, Music2, Settings, Layout, LogOut, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../hooks/useUI';
import './ExploreModal.css';

const ExploreModal = () => {
    const navigate = useNavigate();
    const { isExplorerOpen, closeExplorer } = useUI();

    if (!isExplorerOpen) return null;

    const mainItems = [
        { id: 'reels', icon: Film, label: 'Reels', path: '/reels' },
        { id: 'spaces', icon: Radio, label: 'Spaces', path: '/servers' },
        { id: 'articles', icon: Globe, label: 'Articles', path: '/articles' },
        { id: 'communities', icon: Users, label: 'Communities', path: '/communities/discover' },
        { id: 'dashboard', icon: Layout, label: 'Dashboard', path: '/artist-dashboard' },
        { id: 'music', icon: Music2, label: 'Music', path: '/music' },
        { id: 'achievements', icon: Trophy, label: 'Achievements', path: '/achievements' },
        { id: 'insights', icon: BarChart3, label: 'Insights', path: '/insights' },
        { id: 'wallet', icon: Wallet, label: 'Wallet', path: '/wallet' },
        { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const handleNavigate = (path) => {
        if (path !== '#') {
            navigate(path);
            closeExplorer();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
        closeExplorer();
    };

    return (
        <div className="explore-overlay" onClick={closeExplorer}>
            <div className="explore-modal shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <button className="explore-close" onClick={closeExplorer}>
                    <X size={24} />
                </button>

                <div className="explore-header">
                    <h1 className="explore-title">Explore <span className="text-gradient">Stride</span></h1>
                    <p className="explore-subtitle">Discover everything rhythmically</p>
                </div>

                <div className="explore-hero-card" onClick={() => handleNavigate('/explore')}>
                    <div className="hero-icon-wrapper">
                        <Sparkles size={32} className="hero-sparkle" />
                    </div>
                    <div className="hero-info">
                        <h3>Stride AI</h3>
                        <p>Intelligent rhythms</p>
                    </div>
                    <div className="hero-dot"></div>
                </div>

                <div className="explore-grid">
                    {mainItems.map((item) => (
                        <div key={item.id} className="explore-item-card" onClick={() => handleNavigate(item.path)}>
                            <div className="item-icon-wrapper">
                                <item.icon size={24} />
                            </div>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="explore-footer">
                    <div className="explore-item-card marketplace" onClick={() => handleNavigate('/marketplace')}>
                        <div className="item-icon-wrapper">
                            <ShoppingBag size={24} />
                        </div>
                        <span>Marketplace</span>
                    </div>
                    <div className="explore-item-card logout" onClick={handleLogout}>
                        <div className="item-icon-wrapper">
                            <LogOut size={24} />
                        </div>
                        <span>Logout</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExploreModal;
