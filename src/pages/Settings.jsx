import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogOut, Shield, Bell, Globe, Moon, Check, Mail, Key, Activity, BadgeCheck, X, ChevronRight, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VerificationModal from '../components/profile/VerificationModal';
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

    // Verification State
    const [verificationCode, setVerificationCode] = useState('');
    const [showVerificationInput, setShowVerificationInput] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(''); // 'sending', 'sent', 'verifying', 'success', 'error'
    const [verificationMsg, setVerificationMsg] = useState('');

    // Blue Tick Verification
    const [showBlueTickModal, setShowBlueTickModal] = useState(false);

    // Profile Audio
    const [uploadingAudio, setUploadingAudio] = useState(false);

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

                            {user?.unlockedPerks?.some(p => ['neon_frame', 'holographic_ring'].includes(p)) && (
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
                        <div className="settings-item" onClick={changeLanguage}>
                            <div className="settings-item-left">
                                <Globe size={20} />
                                <span>Language</span>
                            </div>
                            <span className="setting-value">{language}</span>
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
        </div >
    );
};

export default Settings;
