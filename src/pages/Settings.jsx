import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogOut, Shield, Bell, Globe, Moon, Check, Mail, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import config from '../config';
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
        document.body.classList.toggle('dark-theme', newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
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
                                    <img src={acc.avatar} alt={acc.name} className="acc-avatar" />
                                    <div className="acc-info">
                                        <span className="acc-name">{acc.name}</span>
                                        <span className="acc-email">{acc.email}</span>
                                    </div>
                                </div>
                                {(acc.id === user?.id || acc.email === user?.email) && <Check size={18} className="active-check" />}
                            </div>
                        ))}
                        <div className="settings-item add-account-item" onClick={() => navigate('/login')}>
                            <div className="settings-item-left">
                                <UserPlus size={20} color="var(--color-primary)" />
                                <span>Add Account</span>
                            </div>
                        </div>
                    </div>
                </div>

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
                    <div className="settings-list">
                        <div className="settings-item" onClick={handleLogout} style={{ color: 'var(--color-danger)' }}>
                            <div className="settings-item-left">
                                <LogOut size={20} />
                                <span>Logout Current Account</span>
                            </div>
                        </div>
                        <div className="settings-item" onClick={handleDeleteAccount} style={{ color: 'var(--color-danger)' }}>
                            <div className="settings-item-left">
                                <Shield size={20} color="var(--color-danger)" />
                                <span>Delete Account</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
