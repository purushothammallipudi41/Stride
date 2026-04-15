import { useEffect, useRef } from 'react';
import './Visualizer.css';

const Visualizer = ({ analyzer, isPlaying }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (!analyzer || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyzer.getByteFrequencyData(dataArray);

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2;
            let barHeight;
            let x = 0;

            // Calculate average frequency for Luminance syncing
            const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
            const glowIntensity = Math.min(average / 128, 1);

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height;

                // Premium Palette: Deep Indigo to Hot Pink
                const gradient = ctx.createLinearGradient(0, height, 0, 0);
                gradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
                gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.8)');
                gradient.addColorStop(1, 'rgba(236, 72, 153, 1)');

                ctx.fillStyle = gradient;
                
                // Dynamic Neon Glow
                ctx.shadowBlur = 15 * glowIntensity;
                ctx.shadowColor = i % 2 === 0 ? '#8b5cf6' : '#ec4899';
                
                // Mirror Spectrum Effect
                const halfWidth = width / 2;
                const mirrorX_Right = halfWidth + x;
                const mirrorX_Left = halfWidth - x - barWidth;

                const drawBar = (bx) => {
                    const radius = 6;
                    const finalHeight = Math.max(barHeight, 3);
                    ctx.beginPath();
                    ctx.roundRect(bx, height - finalHeight, barWidth - 4, finalHeight, [radius, radius, 2, 2]);
                    ctx.fill();
                };

                drawBar(mirrorX_Right);
                drawBar(mirrorX_Left);

                x += barWidth;
                if (halfWidth + x > width) break;
            }
        };

        if (isPlaying) {
            draw();
        } else {
            // Premium Idle State: Breathing bars
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2;
            const halfWidth = canvas.width / 2;
            let x = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            for (let i = 0; i < bufferLength; i++) {
                ctx.beginPath();
                ctx.roundRect(halfWidth + x, canvas.height - 4, barWidth - 4, 4, [2, 2, 0, 0]);
                ctx.roundRect(halfWidth - x - barWidth, canvas.height - 4, barWidth - 4, 4, [2, 2, 0, 0]);
                ctx.fill();
                x += barWidth;
                if (halfWidth + x > canvas.width) break;
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyzer, isPlaying]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
                canvasRef.current.height = 100;
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="visualizer-container">
            <canvas ref={canvasRef} height="100" />
        </div>
    );
};

export default Visualizer;
