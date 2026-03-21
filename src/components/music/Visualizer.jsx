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

            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height;

                // Gradient for bars
                const gradient = ctx.createLinearGradient(0, height, 0, 0);
                gradient.addColorStop(0, '#8b5cf6'); // Primary purple
                gradient.addColorStop(1, '#ec4899'); // Accent pink

                ctx.fillStyle = gradient;
                
                // Rounded bar effect
                const radius = 4;
                const minHeight = 4;
                const finalHeight = Math.max(barHeight, minHeight);
                
                ctx.beginPath();
                ctx.roundRect(x, height - finalHeight, barWidth - 2, finalHeight, [radius, radius, 0, 0]);
                ctx.fill();

                x += barWidth;
            }
        };

        if (isPlaying) {
            draw();
        } else {
            // Draw static/empty state
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = 0; i < bufferLength; i++) {
                ctx.beginPath();
                ctx.roundRect(x, canvas.height - 4, barWidth - 2, 4, [2, 2, 0, 0]);
                ctx.fill();
                x += barWidth;
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
