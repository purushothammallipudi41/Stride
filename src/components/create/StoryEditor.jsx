
import { useState, useRef, useEffect } from 'react';
import { Camera, Type, Smile, Palette, ChevronLeft, Check, Trash2, Wand2 } from 'lucide-react';
import './StoryEditor.css';
import { mergeLayers } from '../../utils/canvasUtils';

const FILTERS = [
    { name: 'Normal', value: 'none' },
    { name: 'Grayscale', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Invert', value: 'invert(100%)' },
    { name: 'Blur', value: 'blur(5px)' },
    { name: 'Brightness', value: 'brightness(150%)' },
    { name: 'Contrast', value: 'contrast(200%)' },
    { name: 'Vintage', value: 'sepia(50%) contrast(150%)' },
];

const StoryEditor = ({ mediaSrc, mediaType, onFinish, onCancel }) => {
    const [activeTool, setActiveTool] = useState(null); // 'draw', 'text', 'sticker', 'filter'
    const [activeFilter, setActiveFilter] = useState('none');
    const [color, setColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(5);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Text Layer State
    const [texts, setTexts] = useState([]); // Array of { id, text, x, y, color, fontSize }
    const [inputText, setInputText] = useState('');
    const [editingTextId, setEditingTextId] = useState(null);
    const dragItem = useRef(null);
    const dragStart = useRef({ x: 0, y: 0 });

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas to match the parent container dimensions for drawing
        // Note: For high-res output, we might want to use actual image dimensions internally, 
        // but for display, we match the CSS layout.
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        contextRef.current = ctx;

        // Re-apply settings on resize (if needed) or deps change
    }, []);

    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = color;
            contextRef.current.lineWidth = brushSize;
        }
    }, [color, brushSize]);

    // Drawing Logic
    const startDrawing = ({ nativeEvent }) => {
        if (activeTool !== 'draw') return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing || activeTool !== 'draw') return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const stopDrawing = () => {
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    // Text Logic
    const addText = () => {
        if (!inputText.trim()) return;

        const newText = {
            id: Date.now(),
            text: inputText,
            x: 0.5, // Center percentages
            y: 0.5,
            color: color,
            fontSize: 24
        };

        setTexts([...texts, newText]);
        setInputText('');
        setActiveTool(null);
    };

    const handleTextDragStart = (e, id) => {
        if (activeTool === 'draw') return;
        dragItem.current = id;
        // Store click offset relative to element if needed, simplified here
    };

    const handleTextDrag = (e) => {
        if (!dragItem.current) return;

        const container = e.currentTarget.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = (clientX - container.left) / container.width;
        const y = (clientY - container.top) / container.height;

        setTexts(texts.map(t =>
            t.id === dragItem.current ? { ...t, x, y } : t
        ));
    };

    const handleTextDragEnd = () => {
        dragItem.current = null;
    };


    const handleSave = async () => {
        try {
            // If it's a video, we can't easily merge canvas on client without heavyweight libs like ffmpeg.wasm
            // For MVP, we'll just return the base media for video.
            // For Image: Merge layers.
            if (mediaType === 'video') {
                onFinish(mediaSrc);
                return;
            }

            const mergedImage = await mergeLayers(
                mediaSrc,
                canvasRef.current,
                texts,
                [], // Stickers TODO
                activeFilter
            );
            onFinish(mergedImage);

        } catch (error) {
            console.error("Failed to merge layers", error);
            // Fallback to original
            onFinish(mediaSrc);
        }
    };

    return (
        <div className="story-editor-container"
            onMouseMove={handleTextDrag}
            onTouchMove={handleTextDrag}
            onMouseUp={handleTextDragEnd}
            onTouchEnd={handleTextDragEnd}
        >
            {/* Base Media */}
            <div className="editor-media-layer">
                {mediaType === 'video' ? (
                    <video src={mediaSrc} autoPlay muted loop playsInline style={{ filter: activeFilter }} />
                ) : (
                    <img src={mediaSrc} alt="Editing" style={{ filter: activeFilter }} />
                )}
            </div>

            {/* Drawing Canvas */}
            <canvas
                ref={canvasRef}
                className="editor-drawing-layer"
                style={{ pointerEvents: activeTool === 'draw' ? 'auto' : 'none' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            />

            {/* Text Layer */}
            <div className="editor-text-layer">
                {texts.map(text => (
                    <div
                        key={text.id}
                        className="draggable-text"
                        style={{
                            left: `${text.x * 100}%`,
                            top: `${text.y * 100}%`,
                            color: text.color,
                            fontSize: `${text.fontSize}px`,
                            fontFamily: 'Inter, sans-serif'
                        }}
                        onMouseDown={(e) => handleTextDragStart(e, text.id)}
                        onTouchStart={(e) => handleTextDragStart(e, text.id)}
                    >
                        {text.text}
                        <button className="delete-text-btn" onClick={() => setTexts(texts.filter(t => t.id !== text.id))}>
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* UI Overlays */}
            <div className="editor-top-bar">
                <button className="icon-btn" onClick={onCancel}><ChevronLeft /></button>
                <div className="editor-tools">
                    <button className={`icon-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => setActiveTool(activeTool === 'text' ? null : 'text')}>
                        <Type />
                    </button>
                    <button className={`icon-btn ${activeTool === 'draw' ? 'active' : ''}`} onClick={() => setActiveTool(activeTool === 'draw' ? null : 'draw')}>
                        <Palette />
                    </button>
                    <button className={`icon-btn ${activeTool === 'filter' ? 'active' : ''}`} onClick={() => setActiveTool(activeTool === 'filter' ? null : 'filter')}>
                        <Wand2 />
                    </button>
                    <button className={`icon-btn ${activeTool === 'sticker' ? 'active' : ''}`} onClick={() => setActiveTool(activeTool === 'sticker' ? null : 'sticker')}>
                        <Smile />
                    </button>
                </div>
                <button className="done-btn" onClick={handleSave}>Done</button>
            </div>

            {/* Color/Tool Options */}
            {activeTool === 'draw' && (
                <div className="tool-options-bar">
                    {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map(c => (
                        <div
                            key={c}
                            className={`color-swatch ${color === c ? 'active' : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setColor(c)}
                        />
                    ))}
                    <input
                        type="range"
                        min="2" max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    />
                </div>
            )}

            {activeTool === 'filter' && (
                <div className="tool-options-bar filter-options-bar">
                    {FILTERS.map(f => (
                        <button
                            key={f.name}
                            className={`filter-btn ${activeFilter === f.value ? 'active' : ''}`}
                            onClick={() => setActiveFilter(f.value)}
                        >
                            {f.name}
                        </button>
                    ))}
                </div>
            )}

            {activeTool === 'text' && (
                <div className="text-input-overlay">
                    <div className="text-tool-top-bar">
                        <button onClick={() => setActiveTool(null)} className="icon-btn"><X /></button>
                        <button onClick={addText} className="done-btn">Done</button>
                    </div>
                    <input
                        autoFocus
                        type="text"
                        placeholder="Type something..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addText()}
                    />
                    <div className="tool-options-bar inline">
                        {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map(c => (
                            <div
                                key={c}
                                className={`color-swatch ${color === c ? 'active' : ''}`}
                                style={{ backgroundColor: c }}
                                onClick={() => setColor(c)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Sticker/Emoji Picker */}
            {activeTool === 'sticker' && (
                <div className="sticker-picker-overlay" onClick={(e) => {
                    if (e.target === e.currentTarget) setActiveTool(null);
                }}>
                    <div className="sticker-grid">
                        {['😀', '😂', '😍', '😎', '😭', '😡', '👍', '👎', '🎉', '🔥', '❤️', '💔', '🍕', '🍔', '🍺', '☕'].map(emoji => (
                            <button
                                key={emoji}
                                className="sticker-btn"
                                onClick={() => {
                                    const newText = {
                                        id: Date.now(),
                                        text: emoji,
                                        x: 0.5,
                                        y: 0.5,
                                        color: '#ffffff',
                                        fontSize: 64 // Large size for emojis
                                    };
                                    setTexts([...texts, newText]);
                                    setActiveTool(null);
                                }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                    <button className="close-sticker-btn" onClick={() => setActiveTool(null)}><X /></button>
                </div>
            )}
        </div>
    );
};

function X(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}

export default StoryEditor;
