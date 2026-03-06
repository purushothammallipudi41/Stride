import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../utils/imageUtils';
import config from '../config';

const InvitePage = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const { currentUser, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const res = await fetch(`${config.API_URL}/api/invites/${code}`);
                if (res.ok) {
                    const data = await res.json();
                    setInviteData(data);
                } else {
                    const err = await res.json();
                    setError(err.error || 'Invalid or expired invite');
                }
            } catch (e) {
                setError('Failed to connect to server');
            } finally {
                setLoading(false);
            }
        };

        if (code) fetchInvite();
    }, [code]);

    const handleJoin = async () => {
        if (!currentUser) {
            navigate('/login', { state: { from: `/invite/${code}` } });
            return;
        }

        setJoining(true);
        try {
            const res = await fetch(`${config.API_URL}/api/invites/${code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id || currentUser._id })
            });

            if (res.ok) {
                showToast('Successfully joined the server!', 'success');
                const data = await res.json();
                navigate(`/servers/${data.serverId}`);
            } else {
                const err = await res.json();
                showToast(err.error || 'Failed to join server', 'error');
            }
        } catch (e) {
            showToast('Connection error', 'error');
        } finally {
            setJoining(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex-center" style={{ height: '100vh', background: '#0b0b0b' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-center" style={{ height: '100vh', background: '#0b0b0b', textAlign: 'center', padding: '20px' }}>
                <div className="glass-card" style={{ padding: '40px', maxWidth: '400px', width: '100%' }}>
                    <h2 style={{ color: 'var(--accent-red)', marginBottom: '10px' }}>Invite Invalid</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{error}</p>
                    <button className="primary-btn" onClick={() => navigate('/')} style={{ width: '100%' }}>Return Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-center" style={{ height: '100vh', background: '#0b0b0b', padding: '20px' }}>
            <div className="glass-card" style={{ padding: '40px', maxWidth: '450px', width: '100%', textAlign: 'center' }}>
                <div style={{ marginBottom: '20px' }}>
                    {inviteData.serverIcon ? (
                        <img
                            src={getImageUrl(inviteData.serverIcon, 'icon')}
                            alt=""
                            style={{ width: '100px', height: '100px', borderRadius: '30px', objectFit: 'cover', margin: '0 auto', border: '2px solid var(--accent-purple)' }}
                        />
                    ) : (
                        <div style={{ width: '100px', height: '100px', borderRadius: '30px', background: 'var(--accent-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', margin: '0 auto' }}>
                            {inviteData.serverName[0].toUpperCase()}
                        </div>
                    )}
                </div>

                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>You've been invited to join</h3>
                <h1 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '30px' }}>{inviteData.serverName}</h1>

                <button
                    className="primary-btn"
                    onClick={handleJoin}
                    style={{ width: '100%', padding: '14px', fontSize: '1.1rem', marginBottom: '15px' }}
                    disabled={joining}
                >
                    {joining ? 'Joining...' : 'Accept Invite'}
                </button>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    By joining, you agree to follow the community guidelines.
                </p>
            </div>
        </div>
    );
};

export default InvitePage;
