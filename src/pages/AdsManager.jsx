import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { Plus, X, BarChart2, Eye, MousePointer, Image as ImageIcon, Loader2 } from 'lucide-react';
import config from '../config';
import './AdsManager.css';

const AdsManager = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { socket } = useSocket();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.on('ad-created', (newAd) => {
                if (newAd.creator === user?._id) {
                    setAds(prev => {
                        const exists = prev.some(a => a._id === newAd._id);
                        if (exists) return prev;
                        return [newAd, ...prev];
                    });
                }
            });

            socket.on('ad-update', (updatedAd) => {
                if (updatedAd.creator === user?._id) {
                    setAds(prev => prev.map(a => a._id === updatedAd._id ? updatedAd : a));
                }
            });
            return () => {
                socket.off('ad-created');
                socket.off('ad-update');
            };
        }
    }, [socket, user?._id]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        link: '',
        image: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (user?._id) {
            fetchMyAds();
        }
    }, [user?._id]);

    const fetchMyAds = async () => {
        try {
            const res = await fetch(`${config.API_URL}/api/ads/user/${user._id}`);
            if (res.ok) {
                const data = await res.json();
                setAds(data);
            }
        } catch (err) {
            console.error('Failed to fetch ads:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content || !formData.link || !formData.image) {
            return showToast('Please fill all fields and upload an image', 'error');
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${config.API_URL}/api/ads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    creator: user._id
                })
            });

            if (res.ok) {
                showToast('Ad created successfully!', 'success');
                setIsModalOpen(false);
                setFormData({ title: '', content: '', link: '', image: null });
                setPreviewUrl(null);
                fetchMyAds();
            } else {
                showToast('Failed to create ad', 'error');
            }
        } catch (err) {
            showToast('Network error', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const totalStats = ads.reduce((acc, ad) => ({
        views: acc.views + (ad.stats?.views || 0),
        clicks: acc.clicks + (ad.stats?.clicks || 0)
    }), { views: 0, clicks: 0 });

    return (
        <div className="ads-manager animate-fade-in">
            <header className="ads-header">
                <div>
                    <h1 className="ads-title text-gradient">Ads Manager</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '5px' }}>
                        Create and track your Stride advertisements
                    </p>
                </div>
                <button className="create-ad-btn" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} />
                    Create New Ad
                </button>
            </header>

            <section className="ads-stats-overview">
                <div className="stat-card">
                    <span className="stat-label">Total Views</span>
                    <span className="stat-value">{totalStats.views.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Total Clicks</span>
                    <span className="stat-value">{totalStats.clicks.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Avg. CTR</span>
                    <span className="stat-value">
                        {totalStats.views > 0
                            ? ((totalStats.clicks / totalStats.views) * 100).toFixed(2)
                            : '0.00'}%
                    </span>
                </div>
            </section>

            <div className="ads-list">
                {loading ? (
                    <div className="flex-center" style={{ gridColumn: '1/-1', height: '200px' }}>
                        <Loader2 className="spin" size={40} color="var(--color-primary)" />
                    </div>
                ) : ads.length > 0 ? (
                    ads.map(ad => (
                        <div key={ad._id} className="ad-card">
                            <span className={`ad-status ${ad.status}`}>{ad.status}</span>
                            <div className="ad-image-container">
                                <img src={ad.image} alt={ad.title} className="ad-image" />
                            </div>
                            <div className="ad-content-wrapper">
                                <h3 className="ad-card-title">{ad.title}</h3>
                                <p className="ad-card-desc">{ad.content}</p>
                                <div className="ad-card-stats">
                                    <div className="ad-stat-item">
                                        <Eye size={16} />
                                        {ad.stats.views}
                                    </div>
                                    <div className="ad-stat-item">
                                        <MousePointer size={16} />
                                        {ad.stats.clicks}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex-center flex-column" style={{ gridColumn: '1/-1', height: '300px', opacity: 0.5 }}>
                        <BarChart2 size={64} style={{ marginBottom: '20px' }} />
                        <p>No ads created yet. Start promoting your rhythm!</p>
                    </div>
                )}
            </div>

            {/* Create Ad Modal */}
            {isModalOpen && (
                <div className="modal-overlay animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="ad-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ margin: 0 }}>Create New Ad</h2>
                            <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form className="ad-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Ad Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Summer Collection 2026"
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    maxLength={50}
                                />
                            </div>

                            <div className="form-group">
                                <label>Ad Content</label>
                                <textarea
                                    placeholder="Tell people about your product/service..."
                                    rows={3}
                                    value={formData.content}
                                    onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    maxLength={200}
                                />
                            </div>

                            <div className="form-group">
                                <label>Destination Link</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={formData.link}
                                    onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label>Ad Creative (Image)</label>
                                <input
                                    type="file"
                                    id="ad-image-input"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleImageChange}
                                />
                                <label htmlFor="ad-image-input" className="image-upload-zone">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="preview-img" />
                                    ) : (
                                        <>
                                            <ImageIcon size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                                            <p>Click to upload creative</p>
                                        </>
                                    )}
                                </label>
                            </div>

                            <button className="submit-btn" type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="spin" size={20} /> : 'Launch Ad'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdsManager;
