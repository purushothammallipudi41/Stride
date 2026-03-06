import { useState, useEffect } from 'react';
import { ShoppingBag, Check, Lock, Sparkles, ChevronLeft, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import config from '../config';
import './MarketplacePage.css';

const MarketplacePage = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [packs, setPacks] = useState([]);
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('browse');
    const [selectedPack, setSelectedPack] = useState(null);
    const [buying, setBuying] = useState(false);
    const [balance, setBalance] = useState(user?.vibeTokens || 0);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    useEffect(() => {
        Promise.all([
            fetch(`${config.API_URL}/api/marketplace/packs`).then(r => r.json()),
            fetch(`${config.API_URL}/api/marketplace/library?email=${encodeURIComponent(user?.email)}`, { headers }).then(r => r.json())
        ]).then(([allPacks, userLib]) => {
            setPacks(Array.isArray(allPacks) ? allPacks : []);
            setLibrary(Array.isArray(userLib) ? userLib.map(p => p._id) : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const isOwned = (pack) => library.includes(pack._id);

    const handleBuy = async (pack) => {
        if (isOwned(pack)) return;
        if (pack.price > 0 && balance < pack.price) {
            showToast('Not enough Vibe Tokens!', 'error');
            return;
        }
        setBuying(pack._id);
        try {
            const res = await fetch(`${config.API_URL}/api/marketplace/packs/${pack._id}/buy`, {
                method: 'POST', headers
            });
            const data = await res.json();
            if (data.success) {
                setLibrary(prev => [...prev, pack._id]);
                if (data.newBalance !== undefined) setBalance(data.newBalance);
                showToast(`🎉 "${pack.name}" added to your library!`, 'success');
            } else {
                showToast(data.error || 'Purchase failed', 'error');
            }
        } catch (e) {
            showToast('Purchase failed', 'error');
        }
        setBuying(false);
    };

    return (
        <div className="marketplace-root">
            {/* Header */}
            <div className="marketplace-header">
                <div className="marketplace-header-top">
                    <ShoppingBag size={22} style={{ color: 'var(--color-primary)' }} />
                    <h1 className="marketplace-title">Vibe Marketplace</h1>
                    <div className="marketplace-balance">
                        <div className="vibe-token-chip">
                            <div className="vibe-token-dot">V</div>
                            <span>{balance.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="marketplace-hero">
                    <Sparkles size={16} />
                    <span>Buy and use exclusive sticker packs with Vibe Tokens</span>
                </div>
                <div className="marketplace-tabs">
                    {['browse', 'library'].map(tab => (
                        <button
                            key={tab}
                            className={`marketplace-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'browse' ? '🛒 Browse' : '📚 My Library'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pack Detail */}
            {selectedPack && (
                <div className="pack-detail-overlay">
                    <div className="pack-detail-modal">
                        <button className="pack-detail-back" onClick={() => setSelectedPack(null)}>
                            <ChevronLeft size={18} /> Back
                        </button>
                        <div className="pack-detail-header">
                            <h2>{selectedPack.name}</h2>
                            {selectedPack.isOfficial && <span className="official-badge">Official</span>}
                        </div>
                        <p className="pack-detail-desc">{selectedPack.description}</p>
                        <div className="pack-stickers-preview">
                            {selectedPack.stickers.map((s, i) => (
                                <div key={i} className="pack-sticker-item">
                                    <img src={s.url} alt={s.name} />
                                    <span>{s.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pack-detail-footer">
                            <div className="pack-price-large">
                                {selectedPack.price === 0 ? (
                                    <span className="free-label">FREE</span>
                                ) : (
                                    <span className="token-price"><span className="token-icon">V</span>{selectedPack.price}</span>
                                )}
                            </div>
                            <button
                                className={`buy-btn-large ${isOwned(selectedPack) ? 'owned' : ''}`}
                                onClick={() => handleBuy(selectedPack)}
                                disabled={isOwned(selectedPack) || buying === selectedPack._id}
                            >
                                {isOwned(selectedPack) ? <><Check size={16} /> Owned</> :
                                    buying === selectedPack._id ? 'Buying...' :
                                        selectedPack.price === 0 ? 'Add Free' : 'Buy Pack'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="marketplace-content">
                {loading ? (
                    <div className="marketplace-loading">
                        {[1, 2, 3, 4].map(i => <div key={i} className="pack-skeleton" />)}
                    </div>
                ) : (
                    <div className="packs-grid">
                        {(activeTab === 'browse' ? packs : packs.filter(p => library.includes(p._id))).map(pack => (
                            <div
                                key={pack._id}
                                className="pack-card"
                                onClick={() => setSelectedPack(pack)}
                            >
                                {pack.isOfficial && <div className="pack-official-ribbon">OFFICIAL</div>}
                                <div className="pack-preview-grid">
                                    {pack.stickers.slice(0, 4).map((s, i) => (
                                        <img key={i} src={s.url} alt={s.name} className="pack-preview-img" />
                                    ))}
                                </div>
                                <div className="pack-card-body">
                                    <h3 className="pack-name">{pack.name}</h3>
                                    <p className="pack-desc">{pack.description}</p>
                                    <div className="pack-footer">
                                        <span className="pack-count">{pack.stickers.length} stickers</span>
                                        <div className="pack-price">
                                            {isOwned(pack) ? (
                                                <span className="owned-label"><Check size={12} /> Owned</span>
                                            ) : pack.price === 0 ? (
                                                <span className="free-label-sm">FREE</span>
                                            ) : (
                                                <span className="token-label"><span className="token-v">V</span>{pack.price}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {activeTab === 'browse' && (
                            <div className="pack-card pack-card-create" onClick={() => showToast('Creator tools coming soon!', 'info')}>
                                <div className="pack-create-inner">
                                    <Plus size={28} opacity={0.4} />
                                    <span>Create a Pack</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketplacePage;
