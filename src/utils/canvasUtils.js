
export const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

export const drawTextOnCanvas = (ctx, textObj) => {
    const { text, x, y, color, fontSize, fontFamily = 'Inter, sans-serif' } = textObj;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add shadow/outline for better visibility
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.lineWidth = 2;
    ctx.strokeText(text, x, y);
    ctx.shadowBlur = 0;

    ctx.fillText(text, x, y);
};

export const mergeLayers = async (baseImageSrc, drawingCanvas, textLayers = [], stickerLayers = [], filter = 'none') => {
    const baseImg = await loadImage(baseImageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size to match base image
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;

    // 1. Draw Base Image with Filter
    ctx.filter = filter;
    ctx.drawImage(baseImg, 0, 0);
    ctx.filter = 'none'; // Reset filter for subsequent layers

    // 2. Draw Drawing Layer (scaled to fit)
    if (drawingCanvas) {
        ctx.drawImage(drawingCanvas, 0, 0, canvas.width, canvas.height);
    }

    // 3. Draw Stickers
    for (const sticker of stickerLayers) {
        try {
            const img = await loadImage(sticker.src);
            // Scale coordinates if the editor view was smaller than actual image
            // Assuming sticker x/y are percentages (0-1) or already scaled?
            // For now, let's assume received coordinates are 0-1 normalized relative to image size
            const x = sticker.x * canvas.width;
            const y = sticker.y * canvas.height;
            const size = sticker.size * canvas.width; // size relative to width

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((sticker.rotation || 0) * Math.PI / 180);
            ctx.drawImage(img, -size / 2, -size / 2, size, size); // Draw centered
            ctx.restore();
        } catch (e) {
            console.error("Failed to draw sticker", e);
        }
    }

    // 4. Draw Text
    textLayers.forEach(layer => {
        const x = layer.x * canvas.width;
        const y = layer.y * canvas.height;
        const fontSize = layer.fontSize * (canvas.width / 1080); // Scale font based on width (assuming 1080p base)

        drawTextOnCanvas(ctx, {
            ...layer,
            x,
            y,
            fontSize
        });
    });

    return canvas.toDataURL('image/webp', 1.0);
};
