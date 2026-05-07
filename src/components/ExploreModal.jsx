import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Globe, Users, Music, Wallet, ShoppingBag, Settings, LogOut, Camera, Gavel } from 'lucide-react';
import { useUI } from '../hooks/useUI';
import GlobalModal from './common/GlobalModal';
import './ExploreModal.css';

const ExploreModal = () => {
    const navigate = useNavigate();
    const { isExplorerOpen, closeExplorer, openVault } = useUI();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    if (!isExplorerOpen) return null;

    const mainItems = [
        { id: 'reels', icon: Film, label: 'Reels', path: '/reels' },
        { id: 'studio', icon: Camera, label: 'Studio', path: '/studio' },
        { id: 'articles', icon: Globe, label: 'Articles', path: '/articles' },
        { id: 'communities', icon: Users, label: 'Communities', path: '/communities/discover' },
        { id: 'music', icon: Music, label: 'Music House', path: '/music' },
        { id: 'governance', icon: Gavel, label: 'Governance', path: '/governance' },
        { id: 'vault', icon: Wallet, label: 'Creator Vault', action: openVault },
        { id: 'marketplace', icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    ];

    const handleItemClick = (item) => {
        if (item.action) {
            item.action();
        } else if (item.path !== '#') {
            navigate(item.path);
            closeExplorer();
        }
    };

    const confirmLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.dispatchEvent(new Event('vyx_auth_update'));
        navigate('/login');
        closeExplorer();
    };

    return (
        <GlobalModal 
            isOpen={isExplorerOpen} 
            onClose={closeExplorer}
            showClose={true}
            maxWidth="500px"
            className="explore-standardized"
        >
            {showLogoutConfirm ? (
                <div className="logout-confirm-panel">
                    <div className="logout-confirm-icon">
                        <LogOut size={32} />
                    </div>
                    <h3>Sign out of Vyx?</h3>
                    <p>You'll need to log back in to access your account.</p>
                    <div className="logout-confirm-actions">
                        <button className="logout-cancel-btn" onClick={() => setShowLogoutConfirm(false)}>
                            Cancel
                        </button>
                        <button className="logout-confirm-btn" onClick={confirmLogout}>
                            Sign Out
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="explore-header">
                        <h1 className="explore-title">Vyx <span className="text-gradient">Hub</span></h1>
                    </div>

                    <div className="explore-grid">
                        {mainItems.map((item) => (
                            <div key={item.id} className="explore-item-card" onClick={() => handleItemClick(item)}>
                                <div className="item-icon-wrapper">
                                    <item.icon size={24} />
                                </div>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="explore-footer">
                        <div className="explore-item-card settings" onClick={() => handleItemClick({ path: '/settings' })}>
                            <div className="item-icon-wrapper">
                                <Settings size={24} />
                            </div>
                            <span>Settings</span>
                        </div>
                        <div className="explore-item-card logout" onClick={() => setShowLogoutConfirm(true)}>
                            <div className="item-icon-wrapper">
                                <LogOut size={24} />
                            </div>
                            <span>Logout</span>
                        </div>
                    </div>
                </>
            )}
        </GlobalModal>
    );
};

export default ExploreModal;
