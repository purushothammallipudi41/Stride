import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Maximize, Crop as CropIcon, Sliders, Type, Layers } from 'lucide-react';
import './MediaStudio.css';

const FILTERS = [
    { name: 'Normal', id: 'normal', filter: 'none' },
    { name: 'Cyberpunk', id: 'cyberpunk', filter: 'hue-rotate(180deg) saturate(1.5) contrast(1.2)' },
    { name: 'Mono', id: 'mono', filter: 'grayscale(1) contrast(1.1)' },
    { name: 'Vintage', id: 'vintage', filter: 'sepia(0.5) contrast(0.9) brightness(1.1) hue-rotate(-20deg)' },
    { name: 'Vaporwave', id: 'vaporwave', filter: 'hue-rotate(280deg) saturate(1.8)' },
    { name: 'Golden Hour', id: 'golden', filter: 'saturate(1.2) sepia(0.2) brightness(1.1)' },
    { name: 'Deep Sea', id: 'sea', filter: 'hue-rotate(160deg) saturate(0.8) brightness(0.9)' },
    { name: 'Noir', id: 'noir', filter: 'grayscale(1) contrast(1.5) brightness(0.8)' },
    { name: 'Solarize', id: 'solar', filter: 'invert(1) hue-rotate(180deg)' },
    { name: 'Acid', id: 'acid', filter: 'saturate(5) hue-rotate(45deg) contrast(1.5)' },
];

const ASPECT_RATIOS = [
    { name: 'Original', ratio: 0 },
    { name: '1:1', ratio: 1 },
    { name: '4:5', ratio: 4/5 },
    { name: '9:16', ratio: 9/16 },
    { name: '16:9', ratio: 16/9 },
];

const MediaStudio = ({ media, onSave, onCancel }) => {
    const [activeTab, setActiveTab] = useState('filters');
    const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
    const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
    const [zoom, setZoom] = useState(1);
    const [isHD, setIsHD] = useState(true);
    
    // Manual Crop State (percentage based)
    const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // Filter preview logic
    const applyToCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = media;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.filter = selectedFilter.filter;
            ctx.drawImage(img, 0, 0);
        };
    };

    const handleConfirm = () => {
        const canvas = document.createElement('canvas');
        const img = imageRef.current;
        if (!img) return;

        // Calculate actual pixel coordinates
        const cropX = (crop.x / 100) * img.naturalWidth;
        const cropY = (crop.y / 100) * img.naturalHeight;
        const cropW = (crop.width / 100) * img.naturalWidth;
        const cropH = (crop.height / 100) * img.naturalHeight;

        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        
        ctx.filter = selectedFilter.filter;
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        const processedMedia = canvas.toDataURL('image/jpeg', 0.9);
        
        onSave({
            media: processedMedia,
            filter: selectedFilter.id,
            isHD,
            cssFilter: selectedFilter.filter,
            crop
        });
    };

    const handleCropMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || activeTab !== 'crop') return;
        
        const deltaX = ((e.clientX - dragStart.x) / containerRef.current.offsetWidth) * 100;
        const deltaY = ((e.clientY - dragStart.y) / containerRef.current.offsetHeight) * 100;
        
        setCrop(prev => ({
            ...prev,
            x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
            y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY))
        }));
        
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const stopDragging = () => setIsDragging(false);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopDragging);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopDragging);
        };
    }, [isDragging, dragStart, activeTab]);

    return (
        <div className="media-studio animate-fade-in">
            <div className="studio-header">
                <button className="studio-close" onClick={onCancel}><X /></button>
                <div className="studio-title">Vision Studio</div>
                <button className="studio-confirm" onClick={handleConfirm}><Check /> Done</button>
            </div>

            <div className="studio-preview-container" ref={containerRef}>
                <div className="preview-canvas-wrapper" style={{ 
                    filter: selectedFilter.filter,
                    transform: `scale(${zoom})`
                }}>
                    <img 
                        ref={imageRef}
                        src={media} 
                        alt="Studio Preview" 
                        className="preview-image" 
                    />
                    
                    {activeTab === 'crop' && (
                        <div 
                            className="manual-crop-box"
                            onMouseDown={handleCropMouseDown}
                            style={{
                                left: `${crop.x}%`,
                                top: `${crop.y}%`,
                                width: `${crop.width}%`,
                                height: `${crop.height}%`
                            }}
                        >
                            <div className="crop-handle nw"></div>
                            <div className="crop-handle ne"></div>
                            <div className="crop-handle sw"></div>
                            <div className="crop-handle se"></div>
                            <div className="crop-grid-line h1"></div>
                            <div className="crop-grid-line h2"></div>
                            <div className="crop-grid-line v1"></div>
                            <div className="crop-grid-line v2"></div>
                        </div>
                    )}
                </div>
                
                <div className="hd-indicator active">
                    <div className="hd-dot"></div>
                    <span>{isHD ? 'UHD 4K ACTIVE' : 'STANDARD'}</span>
                </div>
            </div>

            <div className="studio-controls">
                <div className="control-tabs">
                    <button 
                        className={`control-tab ${activeTab === 'filters' ? 'active' : ''}`}
                        onClick={() => setActiveTab('filters')}
                    >
                        <Layers size={18} /> Filters
                    </button>
                    <button 
                        className={`control-tab ${activeTab === 'crop' ? 'active' : ''}`}
                        onClick={() => setActiveTab('crop')}
                    >
                        <CropIcon size={18} /> Tool
                    </button>
                    <button 
                        className={`control-tab ${activeTab === 'zoom' ? 'active' : ''}`}
                        onClick={() => setActiveTab('zoom')}
                    >
                        <Maximize size={18} /> Scale
                    </button>
                </div>

                {activeTab === 'filters' && (
                    <div className="filters-scroll animate-slide-up">
                        {FILTERS.map((f) => (
                            <div 
                                key={f.id} 
                                className={`filter-item ${selectedFilter.id === f.id ? 'active' : ''}`}
                                onClick={() => setSelectedFilter(f)}
                            >
                                <div className="filter-preview-box" style={{ filter: f.filter }}>
                                    <img src={media} alt={f.name} />
                                </div>
                                <span>{f.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'crop' && (
                    <div className="aspect-ratios animate-slide-up">
                        {ASPECT_RATIOS.map((r) => (
                            <button 
                                key={r.name} 
                                className={`ratio-btn ${aspectRatio.name === r.name ? 'active' : ''}`}
                                onClick={() => {
                                    setAspectRatio(r);
                                    if (r.ratio) {
                                        setCrop(prev => ({ ...prev, height: prev.width / r.ratio }));
                                    }
                                }}
                            >
                                {r.name}
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'zoom' && (
                    <div className="zoom-slider-container animate-slide-up">
                        <span className="zoom-label">ZOOM</span>
                        <input 
                            type="range" 
                            min="1" 
                            max="3" 
                            step="0.01" 
                            value={zoom} 
                            onChange={(e) => setZoom(parseFloat(e.target.value))} 
                            className="zoom-slider"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaStudio;
