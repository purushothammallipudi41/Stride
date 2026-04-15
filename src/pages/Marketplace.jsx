import React, { useState } from 'react';
import { ShoppingBag, Coins, Rocket, Guitar, Bot, Disc, GlassWater, Music, Satellite, BatteryFull } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import './Marketplace.css';

const Marketplace = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('store');

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

    return (
        <div className="marketplace-container animate-fade-in">
            <PageHeader 
                title="Stride Marketplace" 
                rightElement={
                    <div className="vibe-tokens-badge-v2">
                        <Coins size={16} className="token-icon" />
                        <span>950 Vibe Tokens</span>
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
                {sections.map((section, sIdx) => (
                    <section key={sIdx} className="market-section">
                        <div className="section-header">
                            <h2>{section.title}</h2>
                            <p>{section.subtitle}</p>
                            <div className="items-count">{section.items.length} stickers</div>
                        </div>
                        <div className="items-grid">
                            {section.items.map((item, iIdx) => (
                                <div key={iIdx} className="market-item-card glass-panel">
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
                ))}
            </main>
        </div>
    );
};

export default Marketplace;
