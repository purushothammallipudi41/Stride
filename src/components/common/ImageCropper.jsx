import { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import './ImageCropper.css';

const ImageCropper = ({ image, onCrop, onCancel, aspectRatio = 1 }) => {
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(new Image());

    useEffect(() => {
        if (image) {
            imageRef.current.src = image;
            imageRef.current.onload = () => {
                centerImage();
                draw();
            };
        }
    }, [image]);

    useEffect(() => {
        draw();
    }, [zoom, offset]);

    const centerImage = () => {
        const container = containerRef.current;
        if (!container) return;

        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const iw = imageRef.current.width;
        const ih = imageRef.current.height;

        const scale = Math.max(cw / iw, ch / ih);
        setZoom(scale);
        setOffset({ x: 0, y: 0 });
    };

    const draw = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !imageRef.current.complete) return;

        const ctx = canvas.getContext('2d');
        const cw = container.clientWidth;
        const ch = container.clientHeight;

        canvas.width = cw;
        canvas.height = ch;

        ctx.clearRect(0, 0, cw, ch);

        const iw = imageRef.current.width * zoom;
        const ih = imageRef.current.height * zoom;

        // Draw image centered with offset
        const x = (cw - iw) / 2 + offset.x;
        const y = (ch - ih) / 2 + offset.y;

        ctx.drawImage(imageRef.current, x, y, iw, ih);

        // Draw selection overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';

        let targetWidth = cw;
        let targetHeight = cw / aspectRatio;

        if (targetHeight > ch) {
            targetHeight = ch;
            targetWidth = ch * aspectRatio;
        }

        const tx = (cw - targetWidth) / 2;
        const ty = (ch - targetHeight) / 2;

        // Outer darkened area
        ctx.beginPath();
        ctx.rect(0, 0, cw, ch);
        ctx.rect(tx, ty, targetWidth, targetHeight);
        ctx.fill('evenodd');

        // Selection border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, targetWidth, targetHeight);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleZoom = (delta) => {
        setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
    };

    const handleConfirm = () => {
        const canvas = document.createElement('canvas');
        const container = containerRef.current;

        let targetWidth = container.clientWidth;
        let targetHeight = container.clientWidth / aspectRatio;

        if (targetHeight > container.clientHeight) {
            targetHeight = container.clientHeight;
            targetWidth = container.clientHeight * aspectRatio;
        }

        // Use higher resolution for the crop
        const exportScale = 2;
        canvas.width = targetWidth * exportScale;
        canvas.height = targetHeight * exportScale;

        const ctx = canvas.getContext('2d');

        const tx = (container.clientWidth - targetWidth) / 2;
        const ty = (container.clientHeight - targetHeight) / 2;

        const iw = imageRef.current.width * zoom;
        const ih = imageRef.current.height * zoom;

        const x = (container.clientWidth - iw) / 2 + offset.x;
        const y = (container.clientHeight - ih) / 2 + offset.y;

        // Calculate source rectangle in the original image
        ctx.drawImage(
            imageRef.current,
            (x - tx) * exportScale,
            (y - ty) * exportScale,
            iw * exportScale,
            ih * exportScale
        );

        onCrop(canvas.toDataURL('image/jpeg', 0.85));
    };

    return (
        <div className="cropper-overlay">
            <div className="cropper-card glass-card">
                <div className="cropper-header">
                    <h3>Crop Image</h3>
                    <button onClick={onCancel} className="close-btn"><X size={20} /></button>
                </div>

                <div
                    className="cropper-container"
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <canvas ref={canvasRef} />
                </div>

                <div className="cropper-controls">
                    <div className="zoom-controls">
                        <button onClick={() => handleZoom(-0.1)}><ZoomOut size={18} /></button>
                        <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.01"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                        />
                        <button onClick={() => handleZoom(0.1)}><ZoomIn size={18} /></button>
                    </div>

                    <div className="action-buttons">
                        <button onClick={centerImage} className="reset-btn" title="Reset View">
                            <RotateCcw size={18} />
                        </button>
                        <button onClick={handleConfirm} className="confirm-btn">
                            <Check size={18} /> Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
