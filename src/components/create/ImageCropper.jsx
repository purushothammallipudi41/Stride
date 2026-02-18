import { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import './ImageCropper.css';

const ImageCropper = ({ src, onCrop, onCancel }) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imgRef = useRef(new Image());

    useEffect(() => {
        imgRef.current.src = src;
        imgRef.current.onload = () => {
            draw();
        };
    }, [src]);

    useEffect(() => {
        draw();
    }, [zoom, rotation, offset]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const img = imgRef.current;

        // Set canvas size to square (Instagram style)
        const size = Math.min(containerRef.current.offsetWidth, 400);
        canvas.width = size;
        canvas.height = size;

        // Fill with black to prevent transparency issues
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        // Move to center
        ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        // Draw image centered
        const aspect = img.width / img.height;
        let dw, dh;
        if (aspect > 1) {
            dh = canvas.height;
            dw = canvas.height * aspect;
        } else {
            dw = canvas.width;
            dh = canvas.width / aspect;
        }

        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
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

    const handleMouseUp = () => setIsDragging(false);

    const handleApply = () => {
        const canvas = canvasRef.current;
        const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCrop(croppedUrl);
    };

    return (
        <div className="cropper-container" ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '20px' }}>
            <div
                className="canvas-wrapper"
                style={{ position: 'relative', cursor: 'move', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas ref={canvasRef} />
                <div className="cropper-grid-overlay">
                    <div className="grid-line v1" />
                    <div className="grid-line v2" />
                    <div className="grid-line h1" />
                    <div className="grid-line h2" />
                </div>
            </div>

            <div className="cropper-controls" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button className="icon-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut size={20} /></button>
                <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    style={{ width: '150px' }}
                />
                <button className="icon-btn" onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn size={20} /></button>
                <button className="icon-btn" onClick={() => setRotation(r => r + 90)}><RotateCw size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button className="secondary-btn" onClick={onCancel} style={{ flex: 1 }}>Reset</button>
                <button className="primary-btn" onClick={handleApply} style={{ flex: 1 }}>Apply Crop</button>
            </div>
        </div>
    );
};

export default ImageCropper;
