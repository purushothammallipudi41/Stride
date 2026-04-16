import React, { useState, useEffect } from 'react';
import { ShoppingBag, Coins, Rocket, Guitar, Bot, Disc, GlassWater, Music, Satellite, BatteryFull, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import PurchaseModal from '../components/social/PurchaseModal';
import { useUI } from '../hooks/useUI';
import './Marketplace.css';

const Marketplace = () => {
    const navigate = useNavigate();
    const { addNotification } = useUI();
    const [activeTab, setActiveTab] = useState('store');
    const [userBalance, setUserBalance] = useState(1250); // Initial live balance mock
    const [libraryItems, setLibraryItems] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    const sections = [
        {
            title: "Neon Nights",
            subtitle: "Electric reactions for your lat...",
            items: [
                { name: 'galaxy', icon: Rocket, price: 50, badge: 'OFFICIAL' },
                { name: 'guitar', icon: Guitar, price: 50 },
                { name: 'robot', icon: Bot, price: 50 },
                { name: 'disk', icon: Disc, price: 50, badge: 'OFFICIAL' },
                { name: 'drink', icon: GlassWater, price: 50 },
                { name: 'dance', icon: Music, price: 50 },
                { name: 'satellite', icon: Satellite, price: 50 },
                { name: 'battery', icon: BatteryFull, price: 50 },
            ]
        },
        {
            title: "Cyber Punk",
            subtitle: "Futuristic assets for the digita...",
            items: [
                { name: 'fire', icon: Rocket, price: 150, badge: 'OFFICIAL' },
                { name: '100', icon: Coins, price: 150 },
                { name: 'hands', icon: Bot, price: 150 },
                { name: 'sparkles', icon: Disc, price: 150 },
            ]
        }
    ];

    const handlePurchaseConfirm = (asset) => {
        setUserBalance(prev => prev - asset.price);
        setLibraryItems(prev => [...prev, { ...asset, acquiredAt: new Date().toISOString() }]);
        setIsCheckoutOpen(false);
        setSelectedAsset(null);
        addNotification({ title: 'Minting Successful', message: `${asset.name} was added to your library!`, type: 'success' });
    };

    return (
        <div className="marketplace-container animate-fade-in">
            <PageHeader 
                title="Stride Marketplace" 
                rightElement={
                    <div className="vibe-tokens-badge-v2" onClick={() => navigate('/wallet')} style={{ cursor: 'pointer' }}>
                        <Coins size={16} className="token-icon" />
                        <span>{userBalance.toLocaleString()} Vibe Tokens</span>
                    </div>
                }
            />
            
            <div className="marketplace-header-subtitle">
                <p>Discover exclusive sticker packs and premium digital assets</p>
            </div>

            <nav className="marketplace-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'store' ? 'active' : ''}`}
                    onClick={() => setActiveTab('store')}
                >
                    Store
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
                    onClick={() => setActiveTab('library')}
                >
                    Library
                </button>
            </nav>

            <main className="marketplace-content">
                {activeTab === 'store' ? (
                    sections.map((section, sIdx) => (
                        <section key={sIdx} className="market-section">
                            <div className="section-header">
                                <h2>{section.title}</h2>
                                <p>{section.subtitle}</p>
                                <div className="items-count">{section.items.length} stickers</div>
                            </div>
                            <div className="items-grid">
                                {section.items.map((item, iIdx) => (
                                    <div 
                                        key={iIdx} 
                                        className="market-item-card glass-panel"
                                        onClick={() => {
                                            setSelectedAsset(item);
                                            setIsCheckoutOpen(true);
                                        }}
                                    >
                                        {item.badge && <span className="item-badge">{item.badge}</span>}
                                        <div className="item-icon-box">
                                            <item.icon size={32} />
                                            <span className="item-name">@{item.name}</span>
                                        </div>
                                        <div className="item-price">
                                            <Coins size={12} />
                                            <span>{item.price}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))
                ) : (
                    <section className="market-section animate-fade-in">
                        <div className="section-header">
                            <h2>My Library</h2>
                            <p>Premium assets and stickers you've collected.</p>
                            <div className="items-count">{libraryItems.length} items</div>
                        </div>
                        {libraryItems.length > 0 ? (
                            <div className="items-grid">
                                {libraryItems.map((item, iIdx) => (
                                    <div key={iIdx} className="market-item-card glass-panel owned">
                                        <div className="item-icon-box">
                                            <item.icon size={32} />
                                            <span className="item-name">@{item.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="library-empty-state">
                                <Wallet size={48} className="empty-icon" />
                                <h3>Your vault is empty</h3>
                                <p>Discover premium drops in the marketplace to grow your collection.</p>
                                <button className="explore-store-btn" onClick={() => setActiveTab('store')}>Browse Store</button>
                            </div>
                        )}
                    </section>
                )}
            </main>

            <PurchaseModal 
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                asset={selectedAsset}
                userBalance={userBalance}
                onConfirm={handlePurchaseConfirm}
            />
        </div>
    );
};

export default Marketplace;
