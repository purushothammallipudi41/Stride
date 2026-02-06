import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogOut, Shield, Bell, Globe, Moon, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
    const { user, accounts, logout, switchAccount, deleteAccount, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark-theme'));
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
    const [language, setLanguage] = useState('English');

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
