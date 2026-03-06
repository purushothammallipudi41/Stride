import React from 'react';

const MinimalApp = () => {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0A0A0A',
            color: 'white',
            fontFamily: 'sans-serif'
        }}>
            <h1 style={{ color: '#7C3AED' }}>Stride Stable Boot</h1>
            <p>Minimal App Mode Enabled</p>
            <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
                <p>Native Bridge Ready: {window.Capacitor ? 'YES' : 'NO'}</p>
                <p>Platform: {window.Capacitor?.getPlatform() || 'web'}</p>
            </div>
        </div>
    );
};

export default MinimalApp;
