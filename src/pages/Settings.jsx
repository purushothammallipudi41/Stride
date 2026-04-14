import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    X, UserPlus, Music, Circle, BadgeCheck, Shield, Bell, 
    Activity, Globe, Moon, Check 
} from 'lucide-react';
import { BASE_URL } from '../utils/api';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import Avatar from '../components/common/Avatar';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const [theme, setTheme] = useState('dark');
    const [notifications, setNotifications] = useState(true);
    const [privateAccount, setPrivateAccount] = useState(false);
    
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    name: parsed.name || parsed.username || 'User',
                    email: parsed.email || 'No email provided',
                    avatar: parsed.avatar || 'https://www.gravatar.com/avatar/0?d=mp',
                    avatarFrame: parsed.avatarFrame || 'none',
                    username: parsed.username || ''
                };
            }
        } catch {
            // ignore
        }
        return {
            name: 'Purushotham Mallipudi',
            email: 'purushothammallipudi41@gmail.com',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            avatarFrame: 'none',
            username: ''
        };
    });

    const handleFrameSwitch = async (e) => {
        const newFrame = e.target.value;
        const previousFrame = user.avatarFrame;
        setUser(prev => ({ ...prev, avatarFrame: newFrame })); // Optimistic update
        
        try {
            const res = await fetch(`${BASE_URL}/api/profile/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, avatarFrame: newFrame })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                setUser(prev => ({ ...prev, avatarFrame: previousFrame })); // Revert on failure
            }
        } catch (err) {
            console.error("Failed to update avatar frame:", err);
            setUser(prev => ({ ...prev, avatarFrame: previousFrame })); // Revert on failure
        }
    };

    return (
        <div className="premium-settings-container animate-fade-in">
            <div className="premium-settings-header">
                <h1>Settings</h1>
                <button className="premium-close-btn" onClick={() => navigate(-1)}>
                    <X size={20} />
                </button>
            </div>

            <div className="premium-settings-scroll">
                
                {/* ACCOUNT SECTION */}
                <div className="ps-section">
                    <h3 className="ps-section-title">Account</h3>
                    
                    <div className="ps-account-card">
                        <div className="ps-account-info-row" onClick={() => navigate('/profile?edit=true')}>
                            <Avatar 
                                src={user.avatar} 
                                alt="Profile" 
                                size={48} 
                                frame={user.avatarFrame || 'none'}
                            />
                            <div className="ps-account-details">
                                <h4>{user.name}</h4>
                                <p>{user.email}</p>
                            </div>
                            <Check size={20} className="ps-check-icon" />
                        </div>
                        <div className="ps-account-divider"></div>
                        <button className="ps-add-account-btn">
                            <UserPlus size={18} />
                            <span>Add Account</span>
                        </button>
                    </div>
                </div>

                {/* PROFILE CUSTOMIZATION SECTION */}
                <div className="ps-section">
                    <h3 className="ps-section-title">Profile Customization</h3>
                    <div className="ps-list-group">
                        
                        <div className="ps-list-item">
                            <div className="ps-item-left">
                                <Music size={22} className="ps-icon-purple" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Profile Theme Song</span>
                                    <span className="ps-item-subtitle">No track set</span>
                                </div>
                            </div>
                            <button className="ps-upload-btn">Upload</button>
                        </div>

                        <div className="ps-list-item">
                            <div className="ps-item-left">
                                <Circle size={22} className="ps-icon-purple" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Avatar Frame</span>
                                    <span className="ps-item-subtitle">Gold Frame</span>
                                </div>
                            </div>
                            <select 
                                className="ps-dropdown" 
                                value={user.avatarFrame} 
                                onChange={handleFrameSwitch}
                                style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                            >
                                <option value="none" style={{ background: '#111' }}>No Frame</option>
                                <option value="gold" style={{ background: '#111' }}>Golden Frame</option>
                                <option value="neon" style={{ background: '#111' }}>Neon Pulse</option>
                                <option value="holographic" style={{ background: '#111' }}>Holographic</option>
                            </select>
                        </div>

                    </div>
                </div>

                {/* ACCOUNT SECURITY SECTION */}
                <div className="ps-section">
                    <h3 className="ps-section-title">Account Security</h3>
                    <div className="ps-list-group">
                        
                        <div className="ps-list-item">
                            <div className="ps-item-left">
                                <BadgeCheck size={22} className="ps-icon-purple" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Get Verified (Official)</span>
                                </div>
                            </div>
                            <Check size={20} className="ps-check-icon" />
                        </div>

                        <div className="ps-list-item toggle-row">
                            <div className="ps-item-left">
                                <Shield size={22} className="ps-icon-muted" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Private Account</span>
                                </div>
                            </div>
                            <label className="ps-switch">
                                <input type="checkbox" checked={privateAccount} onChange={() => setPrivateAccount(!privateAccount)} />
                                <span className="ps-slider round"></span>
                            </label>
                        </div>

                        <div className="ps-list-item toggle-row">
                            <div className="ps-item-left">
                                <Bell size={22} className="ps-icon-muted" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Notifications</span>
                                </div>
                            </div>
                            <label className="ps-switch">
                                <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
                                <span className="ps-slider round"></span>
                            </label>
                        </div>

                    </div>
                </div>

                {/* PROMOTIONS SECTION */}
                <div className="ps-section">
                    <h3 className="ps-section-title">Promotions</h3>
                    <div className="ps-list-group">
                        <div className="ps-list-item">
                            <div className="ps-item-left">
                                <Activity size={22} className="ps-icon-muted" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Ads Manager</span>
                                </div>
                            </div>
                            <span className="ps-item-value">Manage your ads</span>
                        </div>
                    </div>
                </div>

                {/* PREFERENCES SECTION */}
                <div className="ps-section">
                    <h3 className="ps-section-title">Preferences</h3>
                    <div className="ps-list-group">
                        <div className="ps-list-item">
                            <div className="ps-item-left">
                                <Globe size={22} className="ps-icon-muted" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Language</span>
                                    <div style={{ marginTop: '8px' }}>
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="ps-list-item toggle-row">
                            <div className="ps-item-left">
                                <Moon size={22} className="ps-icon-muted" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Dark Mode</span>
                                </div>
                            </div>
                            <label className="ps-switch">
                                <input type="checkbox" checked={theme === 'dark'} onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
                                <span className="ps-slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* ABOUT & LEGAL SECTION */}
                <div className="ps-section">
                    <h3 className="ps-section-title">About & Legal</h3>
                    <div className="ps-list-group">
                        <div className="ps-list-item">
                            <div className="ps-item-left">
                                <Shield size={22} className="ps-icon-muted" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Terms of Service</span>
                                </div>
                            </div>
                        </div>
                        <div className="ps-list-item">
                            <div className="ps-item-left">
                                <Shield size={22} className="ps-icon-muted" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Privacy Policy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
