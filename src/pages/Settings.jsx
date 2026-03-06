import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogOut, Shield, Bell, Globe, Moon, Check, Mail, Key, Activity, BadgeCheck, X, ChevronRight, Music, Monitor } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VerificationModal from '../components/profile/VerificationModal';
import BotDashboard from '../components/profile/BotDashboard';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import config from '../config';
import { uploadToCloudinary } from '../utils/cloudinaryUtils';
import './Settings.css';

const Settings = () => {
    const { user, accounts, logout, switchAccount, deleteAccount, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark-theme'));
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
    const [language, setLanguage] = useState('English');

    // 2FA State
    const { setup2FA, verify2FA, disable2FA, refreshUser } = useAuth();
    const [is2FAEnabled, setIs2FAEnabled] = useState(user?.isTwoFactorEnabled || false);
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [setupSecret, setSetupSecret] = useState('');
    const [setupToken, setSetupToken] = useState('');
    const [showDisable2FA, setShowDisable2FA] = useState(false);
    const [disableToken, setDisableToken] = useState('');
    const [is2FALoading, setIs2FALoading] = useState(false);
    const [twoFactorError, setTwoFactorError] = useState('');

    // Session State
    const [sessions, setSessions] = useState([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    // Verification State
    const [verificationCode, setVerificationCode] = useState('');
    const [showVerificationInput, setShowVerificationInput] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(''); // 'sending', 'sent', 'verifying', 'success', 'error'
    const [verificationMsg, setVerificationMsg] = useState('');

    // Blue Tick Verification
    const [showBlueTickModal, setShowBlueTickModal] = useState(false);
    const [showBotDashboard, setShowBotDashboard] = useState(false);

    // Profile Audio
    const [uploadingAudio, setUploadingAudio] = useState(false);

    useEffect(() => {
        if (user?.email) {
            fetchSessions();
        }
    }, [user?.email]);

    const fetchSessions = async () => {
        setIsLoadingSessions(true);
        try {
            const res = await fetch(`${config.API_URL}/api/auth/sessions?email=${user.email}`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (e) {
            console.error("Failed to fetch sessions", e);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const handleRevokeSession = async (sessionId) => {
        try {
            const res = await fetch(`${config.API_URL}/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
            if (res.ok) {
                setSessions(prev => prev.filter(s => s._id !== sessionId));
            }
        } catch (e) {
            alert("Failed to revoke session");
        }
    };

    const handleClearOtherSessions = async () => {
        if (!window.confirm("Are you sure you want to log out from all other devices?")) return;
        try {
            const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${config.API_URL}/api/auth/sessions/clear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, exceptToken: currentToken })
            });
            if (res.ok) {
                fetchSessions();
            }
        } catch (e) {
            alert("Failed to clear sessions");
        }
    };

    const handleLogout = () => {
        logout();
        if (accounts.length <= 1) navigate('/login');
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                await deleteAccount();
                navigate('/login');
            } catch (error) {
                alert('Failed to delete account');
            }
        }
    };

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        }
    };

    const toggleNotifications = () => {
        setNotificationsEnabled(!notificationsEnabled);
        // In a real app, we'd update this on the backend too
    };

    const togglePrivate = async () => {
        const newState = !isPrivate;
        setIsPrivate(newState);
        try {
            await updateProfile({ isPrivate: newState });
        } catch (error) {
            setIsPrivate(!newState); // Revert on failure
            alert('Failed to update privacy settings');
        }
    };

    const changeLanguage = () => {
        const langs = ['English', 'Spanish', 'French', 'German', 'Japanese'];
        const currentIdx = langs.indexOf(language);
        const nextLang = langs[(currentIdx + 1) % langs.length];
        setLanguage(nextLang);
    };

    const requestVerification = async () => {
        if (!user || user.isVerified) return;
        setVerificationStatus('sending');
        setVerificationMsg('Sending code...');
        try {
            const res = await fetch(`${config.API_URL}/api/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });
            if (res.ok) {
                setVerificationStatus('sent');
                setVerificationMsg('Code sent! Check your email.');
                setShowVerificationInput(true);
            } else {
                throw new Error('Failed to send code');
            }
        } catch (e) {
            setVerificationStatus('error');
            setVerificationMsg(e.message || 'Error sending code');
        }
    };

    const submitVerification = async () => {
        if (!verificationCode) return;
        setVerificationStatus('verifying');
        setVerificationMsg('Verifying...');
        try {
            const res = await fetch(`${config.API_URL}/api/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, code: verificationCode })
            });
            const data = await res.json();
            if (res.ok) {
                setVerificationStatus('success');
                setVerificationMsg('Email verified successfully!');
                setTimeout(() => {
                    setShowVerificationInput(false);
                    // Update local user state via context
                    if (user) {
                        const updatedUser = { ...user, isVerified: true };
                        // We need a way to update the user in context without full login
                        // But refreshUser should handle it if we call it
                        // For now, let's try to force a refresh
                        window.location.reload();
                    }
                }, 1500);
            } else {
                throw new Error(data.error || 'Verification failed');
            }
        } catch (e) {
            setVerificationStatus('error');
            setVerificationMsg(e.message || 'Invalid code');
        }
    };

    const handleStart2FASetup = async () => {
        setIs2FALoading(true);
        setTwoFactorError('');
        try {
            const res = await setup2FA(user.email);
            if (res.qrCodeUrl) {
                setQrCodeUrl(res.qrCodeUrl);
                setSetupSecret(res.secret);
                setShow2FASetup(true);
            } else {
                throw new Error(res.error || 'Failed to start 2FA setup');
            }
        } catch (e) {
            setTwoFactorError(e.message);
        } finally {
            setIs2FALoading(false);
        }
    };

    const handleVerify2FASetup = async () => {
        if (setupToken.length !== 6) return;
        setIs2FALoading(true);
        setTwoFactorError('');
        try {
            const res = await verify2FA(user.email, setupToken);
            if (res.success) {
                setIs2FAEnabled(true);
                setShow2FASetup(false);
                setSetupToken('');
                await refreshUser();
            } else {
                throw new Error(res.error || 'Invalid verification token');
            }
        } catch (e) {
            setTwoFactorError(e.message);
        } finally {
            setIs2FALoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (disableToken.length !== 6) return;
        setIs2FALoading(true);
        setTwoFactorError('');
        try {
            const res = await disable2FA(user.email, disableToken);
            if (res.success) {
                setIs2FAEnabled(false);
                setShowDisable2FA(false);
                setDisableToken('');
                await refreshUser();
            } else {
                throw new Error(res.error || 'Invalid token');
            }
        } catch (e) {
            setTwoFactorError(e.message);
        } finally {
            setIs2FALoading(false);
        }
    };

    return (
        <div className="settings-container">
            <header className="settings-header">
                <h2>Settings</h2>
                <button
                    className="close-settings-btn"
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px'
                    }}
                >
                    <X size={20} />
                </button>
            </header>

            <div className="settings-content">
                {/* Account Switching Section */}
                <div className="settings-group">
                    <div className="group-header">
                        <h3>Account</h3>
                    </div>
                    <div className="settings-list accounts-list">
                        {accounts.map((acc) => (
                            <div
                                key={acc.email}
                                className={`settings-item account-item ${(acc.id === user?.id || acc.email === user?.email) ? 'active' : ''}`}
                                onClick={() => switchAccount(acc.id || acc.email)}
                            >
                                <div className="settings-item-left">
                                    <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                                        <img src={acc.avatar} alt={acc.name} className="acc-avatar" style={{ width: '100%', height: '100%' }} />
                                        {(acc.id === user?.id || acc.email === user?.email) && (
                                            <>
                                                <div
                                                    className="avatar-overlay"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        document.getElementById('avatar-upload').click();
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        background: 'rgba(0,0,0,0.5)',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        opacity: 0,
                                                        transition: 'opacity 0.2s',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                                >
                                                    <span style={{ fontSize: '0.6rem', color: 'white', fontWeight: 700 }}>EDIT</span>
                                                </div>
                                                <input
                                                    type="file"
                                                    id="avatar-upload"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;

                                                        const reader = new FileReader();
                                                        reader.onloadend = async () => {
                                                            try {
                                                                await updateProfile({ avatar: reader.result });
                                                            } catch (err) {
                                                                alert('Failed to update profile picture');
                                                            }
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }}
                                                />
                                            </>
                                        )}
                                    </div>
                                    <div className="acc-info">
                                        <span className="acc-name">{acc.name}</span>
                                        <span className="acc-email">{acc.email}</span>
                                    </div>
                                </div>
                                {(acc.id === user?.id || acc.email === user?.email) && <Check size={18} className="active-check" />}
                            </div>
                        ))}
                        <div className="settings-item add-account-item" onClick={() => navigate('/login', { state: { addAccount: true } })}>
                            <div className="settings-item-left">
                                <UserPlus size={20} color="var(--color-primary)" />
                                <span>Add Account</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Customization Section */}
                {user?.unlockedPerks?.some(p => ['profile_audio', 'neon_frame', 'holographic_ring'].includes(p)) && (
                    <div className="settings-group">
                        <div className="group-header">
                            <h3>Profile Customization</h3>
                        </div>
                        <div className="settings-list">
                            {user?.unlockedPerks?.includes('profile_audio') && (
                                <div className="settings-item">
                                    <div className="settings-item-left">
                                        <Music size={20} color="var(--color-primary)" />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>Profile Theme Song</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                                                {user.profileThemeUrl ? 'Audio track active' : 'No track set'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="settings-item-right">
                                        <input
                                            type="file"
                                            id="profile-audio-upload"
                                            accept="audio/*"
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                setUploadingAudio(true);
                                                try {
                                                    const uploadedUrl = await uploadToCloudinary(file);
                                                    if (uploadedUrl) {
                                                        await updateProfile({ profileThemeUrl: uploadedUrl });
                                                    }
                                                } catch (err) {
                                                    alert('Failed to upload audio');
                                                } finally {
                                                    setUploadingAudio(false);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => document.getElementById('profile-audio-upload').click()}
                                            style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                                            disabled={uploadingAudio}
                                        >
                                            {uploadingAudio ? 'Uploading...' : (user.profileThemeUrl ? 'Change' : 'Upload')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {user?.unlockedPerks?.some(p => ['neon_frame', 'holographic_ring', 'gold_frame'].includes(p)) && (
                                <div className="settings-item">
                                    <div className="settings-item-left">
                                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--color-primary)' }} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>Avatar Frame</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                                                {user.activeAvatarFrame ? user.activeAvatarFrame.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'No frame selected'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="settings-item-right">
                                        <select
                                            value={user.activeAvatarFrame || ''}
                                            onChange={(e) => updateProfile({ activeAvatarFrame: e.target.value || null })}
                                            style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                color: 'white',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="" style={{ color: 'black' }}>None</option>
                                            {user?.unlockedPerks?.includes('neon_frame') && <option value="neon_frame" style={{ color: 'black' }}>Neon Frame</option>}
                                            {user?.unlockedPerks?.includes('holographic_ring') && <option value="holographic_ring" style={{ color: 'black' }}>Holographic Ring</option>}
                                            {user?.unlockedPerks?.includes('gold_frame') && <option value="gold_frame" style={{ color: 'black' }}>Golden Frame</option>}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="settings-group">
                    <h3>Account Security</h3>
                    <div className="settings-list">
                        {/* Email Verification Section */}
                        {!user?.isVerified && (
                            <div className="settings-item-column">
                                <div className="settings-item" onClick={requestVerification}>
                                    <div className="settings-item-left">
                                        <Mail size={20} color="var(--color-warning)" />
                                        <span>Verify Email</span>
                                    </div>
                                    <div className="settings-item-right">
                                        {verificationStatus === 'success' ? <Check size={18} color="var(--color-success)" /> : <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>Verify Now</span>}
                                    </div>
                                </div>
                                {showVerificationInput && (
                                    <div className="verification-input-container" style={{ padding: '0 1rem 1rem 1rem', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                                            {verificationMsg}
                                        </p>
                                        {verificationStatus !== 'success' && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="123456"
                                                    value={verificationCode}
                                                    onChange={(e) => setVerificationCode(e.target.value)}
                                                    maxLength={6}
                                                    style={{
                                                        flex: 1,
                                                        background: 'var(--color-bg)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '8px',
                                                        padding: '8px',
                                                        color: 'var(--color-text)',
                                                        textAlign: 'center',
                                                        letterSpacing: '2px'
                                                    }}
                                                />
                                                <button
                                                    onClick={submitVerification}
                                                    disabled={verificationStatus === 'verifying'}
                                                    style={{
                                                        background: 'var(--color-primary)',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        padding: '0 15px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Check size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="settings-item" onClick={() => setShowBlueTickModal(true)}>
                            <div className="settings-item-left">
                                <BadgeCheck size={20} color={user?.isOfficial ? 'var(--color-primary)' : 'var(--text-secondary)'} fill={user?.isOfficial ? 'var(--color-primary-glow)' : 'transparent'} />
                                <span>Get Verified {user?.isOfficial && '(Official)'}</span>
                            </div>
                            <div className="settings-item-right">
                                {user?.isOfficial ? (
                                    <Check size={18} color="var(--color-primary)" />
                                ) : (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {user?.verificationRequest?.status === 'pending' ? 'Pending' : 'Apply'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="settings-item" onClick={togglePrivate}>
                            <div className="settings-item-left">
                                <Shield size={20} />
                                <span>Private Account</span>
                            </div>
                            <div className={`toggle-switch ${isPrivate ? 'active' : ''}`}></div>
                        </div>
                        <div className="settings-item" onClick={toggleNotifications}>
                            <div className="settings-item-left">
                                <Bell size={20} />
                                <span>Notifications</span>
                            </div>
                            <div className={`toggle-switch ${notificationsEnabled ? 'active' : ''}`}></div>
                        </div>

                        {/* 2FA Section */}
                        <div className="settings-item-column">
                            <div
                                className="settings-item"
                                onClick={() => is2FAEnabled ? setShowDisable2FA(true) : handleStart2FASetup()}
                                style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}
                            >
                                <div className="settings-item-left">
                                    <Shield size={20} color={is2FAEnabled ? 'var(--color-success)' : 'inherit'} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span>Two-Factor Authentication</span>
                                        <span style={{ fontSize: '0.75rem', color: is2FAEnabled ? 'var(--color-success)' : 'var(--color-text-light)' }}>
                                            {is2FAEnabled ? 'Enabled' : 'Secure your account'}
                                        </span>
                                    </div>
                                </div>
                                <div className="settings-item-right">
                                    <ChevronRight size={18} />
                                </div>
                            </div>

                            {show2FASetup && (
                                <div className="2fa-setup-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginTop: '10px' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-text-light)' }}>
                                            Scan this QR code with your authenticator app (like Google Authenticator or Authy).
                                        </p>
                                        <img src={qrCodeUrl} alt="2FA QR Code" style={{ background: 'white', padding: '10px', borderRadius: '8px', width: '200px', height: '200px' }} />
                                        <div style={{ marginTop: '1rem' }}>
                                            <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{setupSecret}</code>
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>Enter 6-digit code</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                placeholder="000000"
                                                maxLength={6}
                                                value={setupToken}
                                                onChange={e => setSetupToken(e.target.value.replace(/\D/g, ''))}
                                                style={{
                                                    flex: 1,
                                                    background: 'var(--color-bg)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '8px',
                                                    padding: '10px',
                                                    color: 'white',
                                                    textAlign: 'center',
                                                    letterSpacing: '4px',
                                                    fontSize: '1.1rem'
                                                }}
                                            />
                                            <button
                                                className="primary-btn"
                                                onClick={handleVerify2FASetup}
                                                disabled={is2FALoading || setupToken.length !== 6}
                                                style={{ padding: '0 20px', borderRadius: '8px' }}
                                            >
                                                Verify
                                            </button>
                                        </div>
                                    </div>
                                    {twoFactorError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '8px' }}>{twoFactorError}</p>}
                                    <button
                                        className="text-btn"
                                        onClick={() => setShow2FASetup(false)}
                                        style={{ width: '100%', marginTop: '1rem', opacity: 0.6 }}
                                    >
                                        Cancel Setup
                                    </button>
                                </div>
                            )}

                            {showDisable2FA && (
                                <div className="2fa-setup-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginTop: '10px' }}>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-text-light)' }}>
                                        Enter your 6-digit authenticator code to disable 2FA.
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={disableToken}
                                            onChange={e => setDisableToken(e.target.value.replace(/\D/g, ''))}
                                            style={{
                                                flex: 1,
                                                background: 'var(--color-bg)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                                padding: '10px',
                                                color: 'white',
                                                textAlign: 'center',
                                                letterSpacing: '4px',
                                                fontSize: '1.1rem'
                                            }}
                                        />
                                        <button
                                            className="danger-btn"
                                            onClick={handleDisable2FA}
                                            disabled={is2FALoading || disableToken.length !== 6}
                                            style={{ padding: '0 20px', borderRadius: '8px' }}
                                        >
                                            Disable
                                        </button>
                                    </div>
                                    {twoFactorError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '8px' }}>{twoFactorError}</p>}
                                    <button
                                        className="text-btn"
                                        onClick={() => setShowDisable2FA(false)}
                                        style={{ width: '100%', marginTop: '1rem', opacity: 0.6 }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Session Management Section */}
                        <div className="settings-group-header" style={{ marginTop: '2rem', marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                            <h4 style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Sessions</h4>
                        </div>
                        <div className="sessions-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {isLoadingSessions ? (
                                <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.6 }}>Loading sessions...</div>
                            ) : sessions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.6 }}>No active sessions found.</div>
                            ) : (
                                <>
                                    {sessions.map(session => (
                                        <div key={session._id} className="session-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: session.token === (localStorage.getItem('token') || sessionStorage.getItem('token')) ? '1px solid rgba(108, 93, 211, 0.3)' : '1px solid transparent' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {session.userAgent?.toLowerCase().includes('mobile') || session.userAgent?.toLowerCase().includes('android') || session.userAgent?.toLowerCase().includes('iphone') ? <Activity size={20} /> : <Monitor size={20} />}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                                        {session.device || 'Unknown Device'}
                                                        {session.token === (localStorage.getItem('token') || sessionStorage.getItem('token')) && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#6C5DD3', background: 'rgba(108, 93, 211, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>This Device</span>}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{session.ip} • Last active: {new Date(session.lastActive).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            {session.token !== (localStorage.getItem('token') || sessionStorage.getItem('token')) && (
                                                <button
                                                    onClick={() => handleRevokeSession(session._id)}
                                                    style={{ background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {sessions.length > 1 && (
                                        <button
                                            className="text-btn danger"
                                            onClick={handleClearOtherSessions}
                                            style={{ color: '#ff4757', marginTop: '8px', fontSize: '0.85rem', width: 'fit-content' }}
                                        >
                                            Sign out from all other devices
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="settings-group">
                    <h3>Promotions</h3>
                    <div className="settings-list">
                        <div className="settings-item" onClick={() => navigate('/ads')}>
                            <div className="settings-item-left">
                                <Activity size={20} />
                                <span>Ads Manager</span>
                            </div>
                            <div className="settings-item-right">
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Manage your ads</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-group">
                    <h3>Preferences</h3>
                    <div className="settings-list">
                        <div className="settings-item" id="settings-language-row">
                            <div className="settings-item-left">
                                <Globe size={20} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <span>Language & Region</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Choose your preferred language</span>
                                </div>
                            </div>
                            <div className="settings-item-right">
                                <LanguageSwitcher />
                            </div>
                        </div>
                        <div className="settings-item" onClick={toggleDarkMode}>
                            <div className="settings-item-left">
                                <Moon size={20} />
                                <span>Dark Mode</span>
                            </div>
                            <div className={`toggle-switch ${isDarkMode ? 'active' : ''}`}></div>
                        </div>
                    </div>
                </div>

                <div className="settings-group">
                    <h3>About & Legal</h3>
                    <div className="settings-list">
                        <div className="settings-item" onClick={() => navigate('/legal/terms')}>
                            <div className="settings-item-left">
                                <Shield size={20} />
                                <span>Terms of Service</span>
                            </div>
                        </div>
                        <div className="settings-item" onClick={() => navigate('/legal/privacy')}>
                            <div className="settings-item-left">
                                <Shield size={20} />
                                <span>Privacy Policy</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-group">
                    <h3>Developer & Bots</h3>
                    <div className="settings-list">
                        <div className="settings-item" onClick={() => setShowBotDashboard(true)}>
                            <div className="settings-item-left">
                                <Activity size={20} color="var(--color-primary)" />
                                <span>Bot Management</span>
                            </div>
                            <div className="settings-item-right">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-group">
                    <div className="settings-list">
                        <div className="settings-item danger-item" onClick={handleLogout}>
                            <div className="settings-item-left">
                                <LogOut size={20} />
                                <span>Logout Current Account</span>
                            </div>
                        </div>
                        <div className="settings-item danger-item" onClick={handleDeleteAccount}>
                            <div className="settings-item-left">
                                <Shield size={20} />
                                <span>Delete Account</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <VerificationModal isOpen={showBlueTickModal} onClose={() => setShowBlueTickModal(false)} />
            {showBotDashboard && <BotDashboard user={user} onClose={() => setShowBotDashboard(false)} />}
        </div>
    );
};

export default Settings;
