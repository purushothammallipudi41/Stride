
export const AR_FILTERS = [
    {
        id: 'none',
        name: 'Normal',
        icon: '🚫',
        type: 'none'
    },
    {
        id: 'cyberpunk',
        name: 'Cyber',
        icon: '🌌',
        type: 'mesh',
        color: '#00f2ff',
        lineWidth: 1
    },
    {
        id: 'glam',
        name: 'Glam',
        icon: '✨',
        type: 'beauty',
        brightness: 1.1,
        contrast: 1.1,
        saturate: 1.2
    },
    {
        id: 'matrix',
        name: 'Matrix',
        icon: '📟',
        type: 'mesh',
        color: '#00ff41',
        lineWidth: 0.5
    },
    {
        id: 'sunset',
        name: 'Sunset',
        icon: '🌅',
        type: 'lut',
        filter: 'sepia(40%) brightness(110%) hue-rotate(-20deg)'
    },
    {
        id: 'ghost',
        name: 'Ghost',
        icon: '👻',
        type: 'mesh',
        color: 'rgba(255, 255, 255, 0.3)',
        lineWidth: 2
    }
];
