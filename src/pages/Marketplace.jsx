import React, { useState, useEffect } from 'react';
import { ShoppingBag, Coins, Rocket, Guitar, Bot, Disc, GlassWater, Music, Satellite, BatteryFull, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import PurchaseModal from '../components/social/PurchaseModal';
import { useUI } from '../hooks/useUI';
import { getStoredUser } from '../utils/storage';
import { BASE_URL } from '../utils/api';
import socket from '../services/socket';
import './Marketplace.css';

const Marketplace = () => {
    const navigate = useNavigate();
    const { addNotification } = useUI();
    const currentUser = getStoredUser();
    const [activeTab, setActiveTab] = useState('store');
    const [userBalance, setUserBalance] = useState(0); 
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

    useEffect(() => {
        if (!currentUser?.username) return;

        // Fetch user profile to get balance and inventory
        fetch(`${BASE_URL}/api/profile/${currentUser.username}`)
            .then(res => res.json())
            .then(data => {
                setUserBalance(data.balance || 0);
                // Map inventory strings to asset objects in the sections
                const allAvailableItems = sections.flatMap(s => s.items);
                const owned = (data.inventory || []).map(name => allAvailableItems.find(i => i.name === name)).filter(Boolean);
                setLibraryItems(owned);
            })
            .catch(err => console.error("Failed to fetch marketplace data:", err));

        // Listen for wallet updates
        socket.on('wallet_updated', ({ balance }) => {
            setUserBalance(balance);
        });

        return () => {
            socket.off('wallet_updated');
        };
    }, [currentUser?.username]);

    const handlePurchaseConfirm = async (asset) => {
        try {
            const res = await fetch(`${BASE_URL}/api/marketplace/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: currentUser.username,
                    assetName: asset.name,
                    price: asset.price
                })
            });
            const data = await res.json();
            
            if (data.success) {
                setUserBalance(data.balance);
                const allAvailableItems = sections.flatMap(s => s.items);
                const owned = (data.inventory || []).map(name => allAvailableItems.find(i => i.name === name)).filter(Boolean);
                setLibraryItems(owned);
                
                setIsCheckoutOpen(false);
                setSelectedAsset(null);
                addNotification({ title: 'Minting Successful', message: `${asset.name} was added to your library!`, type: 'success' });
            } else {
                addNotification({ title: 'Purchase Failed', message: data.error || 'Transaction rejected.', type: 'error' });
            }
        } catch (err) {
            console.error("Purchase error:", err);
            addNotification({ title: 'Purchase Error', message: 'Unable to connect to economy pulse.', type: 'error' });
        }
    };

    return (
        <div className="marketplace-container-outer">
            <PageHeader 
                title="Vyx Marketplace" 
                rightElement={
                    <div className="vibe-tokens-badge-v2" onClick={() => navigate('/wallet')} style={{ cursor: 'pointer' }}>
                        <Coins size={16} className="token-icon" />
                        <span>{userBalance.toLocaleString()} Vibe Tokens</span>
                    </div>
                }
            />
            <div className="marketplace-container animate-fade-in">
            
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
        </div>
    );
};

export default Marketplace;
