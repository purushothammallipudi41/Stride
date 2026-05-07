import { useEffect, useRef } from 'react';

const AudioVisualizer = ({ audioRef, isActive, color = '#0066ff' }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const analyserRef = useRef();
    const contextRef = useRef();

    useEffect(() => {
        if (!audioRef.current || !isActive) return;

        if (!contextRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            contextRef.current = new AudioContext();
            analyserRef.current = contextRef.current.createAnalyser();
            const source = contextRef.current.createMediaElementSource(audioRef.current);
            source.connect(analyserRef.current);
            analyserRef.current.connect(contextRef.current.destination);
            analyserRef.current.fftSize = 256;
        }

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            requestRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height;
                
                // Use the primary theme color with transparency
                ctx.fillStyle = color + 'CC'; // CC = 80% opacity
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();

        return () => {
            cancelAnimationFrame(requestRef.current);
        };
    }, [audioRef, isActive, color]);

    return (
        <canvas 
            ref={canvasRef} 
            width={300} 
            height={100} 
            style={{ 
                width: '100%', 
                height: '60px', 
                opacity: isActive ? 1 : 0, 
                transition: 'opacity 0.5s ease',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 0 5px ' + color + '40)'
            }} 
        />
    );
};

export default AudioVisualizer;
