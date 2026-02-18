import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';
import { Hash, X, ChevronLeft, ChevronRight, Download, ExternalLink, Image as ImageIcon, Video } from 'lucide-react';
import './MediaGallery.css';

const MediaGallery = ({ serverId, onClose }) => {
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItemIndex, setSelectedItemIndex] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (serverId) {
            fetchMedia();
        }
    }, [serverId]);

    const fetchMedia = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${config.API_URL}/api/servers/${serverId}/media`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter out any without valid content
                    setMediaItems(data.filter(item => item.text && (item.text.startsWith('http') || item.text.startsWith('data:'))));
                }
            }
        } catch (error) {
            console.error("Failed to fetch media:", error);
        } finally {
            setLoading(false);
        }
    };

    const openLightbox = (index) => {
        setSelectedItemIndex(index);
    };

    const closeLightbox = () => {
        setSelectedItemIndex(null);
    };

    const nextImage = (e) => {
        if (e) e.stopPropagation();
        setSelectedItemIndex((prev) => (prev + 1) % mediaItems.length);
    };

    const prevImage = (e) => {
        if (e) e.stopPropagation();
        setSelectedItemIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (selectedItemIndex !== null) {
                if (e.key === 'ArrowRight') nextImage();
                if (e.key === 'ArrowLeft') prevImage();
                if (e.key === 'Escape') closeLightbox();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItemIndex, mediaItems]);


    const selectedItem = selectedItemIndex !== null ? mediaItems[selectedItemIndex] : null;

    return (
        <div className="media-gallery-container animate-fade-in">
            <div className="gallery-header glass-header">
                <div className="header-left">
                    <h3><ImageIcon size={20} style={{ marginRight: '8px', color: 'var(--color-primary)' }} /> Server Media</h3>
                    <span className="media-count">{mediaItems.length} items shared</span>
                </div>
                <button onClick={onClose} className="icon-btn close-gallery-btn">
                    <X size={24} />
                </button>
            </div>

            <div className="gallery-content premium-scrollbar">
                {loading ? (
                    <div className="gallery-loading">
                        <div className="loading-spinner"></div>
                    </div>
                ) : mediaItems.length === 0 ? (
                    <div className="gallery-empty">
                        <div className="empty-state-icon">
                            <ImageIcon size={48} />
                        </div>
                        <h3>No media yet</h3>
                        <p>Photos and videos shared in channels will appear here.</p>
                    </div>
                ) : (
                    <div className="media-grid">
                        {mediaItems.map((item, index) => (
                            <div
                                key={item._id || index}
                                className="media-grid-item card-hover-effect"
                                onClick={() => openLightbox(index)}
                            >
                                <div className="media-thumbnail-wrapper">
                                    {item.type === 'video' ? (
                                        <>
                                            <video src={item.text} muted className="thumbnail-video" />
                                            <div className="video-overlay-icon">
                                                <Video size={24} fill="white" />
                                            </div>
                                        </>
                                    ) : (
                                        <img src={item.text} alt="Server media" loading="lazy" className="thumbnail-image" />
                                    )}
                                </div>
                                <div className="media-info-hover">
                                    <div className="media-author-info">
                                        <img src={item.userAvatar} alt="" />
                                        <span>@{item.username}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {selectedItem && (
                <div className="lightbox-overlay animate-active" onClick={closeLightbox}>
                    <button className="lightbox-nav prev" onClick={prevImage}>
                        <ChevronLeft size={40} />
                    </button>

                    <div className="lightbox-content-wrapper" onClick={e => e.stopPropagation()}>
                        <div className="lightbox-media-container">
                            {selectedItem.type === 'video' ? (
                                <video
                                    src={selectedItem.text}
                                    controls
                                    autoPlay
                                    className="lightbox-media"
                                />
                            ) : (
                                <img
                                    src={selectedItem.text}
                                    alt="Full size"
                                    className="lightbox-media"
                                />
                            )}
                        </div>

                        <div className="lightbox-details-panel glass-card">
                            <div className="user-info-row">
                                <img src={selectedItem.userAvatar} alt="" className="avatar-medium" />
                                <div className="user-text-col">
                                    <span className="username-active">{selectedItem.username}</span>
                                    <span className="timestamp-detail">{new Date(selectedItem.timestamp).toLocaleString()}</span>
                                </div>
                                <a
                                    href={selectedItem.text}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="icon-btn download-btn"
                                    title="Open Original"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <ExternalLink size={20} />
                                </a>
                            </div>
                            <div className="media-meta-row">
                                <span className="channel-tag"><Hash size={12} /> {selectedItem.channelId}</span>
                            </div>
                        </div>
                    </div>

                    <button className="lightbox-nav next" onClick={nextImage}>
                        <ChevronRight size={40} />
                    </button>

                    <button className="lightbox-close-btn" onClick={closeLightbox}>
                        <X size={24} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default MediaGallery;
