import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    X, UserPlus, Music, Circle, BadgeCheck, Shield, Bell, 
    Activity, Globe, Moon, Check, HelpCircle, Crown, LogOut,
    Trophy, BarChart3, Layout, Key, Eye, EyeOff
} from 'lucide-react';
import { BASE_URL } from '../utils/api';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import Avatar from '../components/common/Avatar';
import SupportModal from '../components/social/SupportModal';
import { useUI } from '../hooks/useUI';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const { addNotification } = useUI();
    const [theme, setTheme] = useState('dark');
    const [notifications, setNotifications] = useState(true);
    const [privateAccount, setPrivateAccount] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
    const [showPw, setShowPw] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');
    
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    ...parsed,
                    name: parsed.name || parsed.username || 'User',
                    email: parsed.email || 'No email provided',
                    avatar: parsed.avatar || "",
                    avatarFrame: parsed.avatarFrame || 'none',
                    username: parsed.username || '',
                    isPremium: parsed.isPremium || false
                };
            }
        } catch {
            // ignore
        }
        return {
            name: 'Purushotham Mallipudi',
            email: 'purushothammallipudi41@gmail.com',
            avatar: "",
            avatarFrame: 'none',
            username: '',
            isPremium: false
        };
    });

    const handleSignOut = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
    };

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
                                <div className="ps-name-row">
                                    <h4>{user.name || `@${user.username}`}</h4>
                                    {user.isPremium && <Crown size={14} className="pro-crown-v2" />}
                                </div>
                                <p>{user.email}</p>
                            </div>
                        </div>
                        <div className="ps-account-divider"></div>
                        <button className="ps-add-account-btn" onClick={() => addNotification({ title: "Multi-Account", message: "Switching accounts will be supported in v3.", type: "info" })}>
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
                            <button className="ps-upload-btn" onClick={() => addNotification({ title: "Theme Song", message: "MP3 uploads unlock at Level 5.", type: "info" })}>Upload</button>
                        </div>

                        <div className="ps-list-item">
                            <div className="ps-item-left">
                                <Circle size={22} className="ps-icon-purple" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Avatar Frame</span>
                                    <span className="ps-item-subtitle">{user.avatarFrame === 'none' ? 'Standard Border' : user.avatarFrame.toUpperCase() + ' Frame'}</span>
                                </div>
                            </div>
                            <select 
                                className="ps-dropdown" 
                                value={user.avatarFrame} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if ((val === 'neon' || val === 'holographic') && !user.isPremium) {
                                        addNotification({ 
                                            title: 'Vyx Pro Required', 
                                            message: 'Neon and Holographic frames are exclusive to Vyx Pro members.', 
                                            type: 'info' 
                                        });
                                        return;
                                    }
                                    handleFrameSwitch(e);
                                }}
                                style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                            >
                                <option value="none" style={{ background: '#111' }}>No Frame</option>
                                <option value="gold" style={{ background: '#111' }}>Golden Frame (Legacy)</option>
                                <option value="neon" style={{ background: '#111' }}>{user.isPremium ? 'Neon Pulse' : '💎 Neon Pulse (Pro)'}</option>
                                <option value="holographic" style={{ background: '#111' }}>{user.isPremium ? 'Holographic' : '💎 Holographic (Pro)'}</option>
                            </select>
                        </div>

                    </div>
                </div>
                
                {/* CREATOR TOOLS & PROGRESS */}
                <div className="ps-section">
                    <h3 className="ps-section-title">Creator Tools & Progress</h3>
                    <div className="ps-list-group">
                        
                        <div className="ps-list-item clickable-item" onClick={() => navigate('/achievements')}>
                            <div className="ps-item-left">
                                <Trophy size={22} className="ps-icon-purple" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Achievements</span>
                                    <span className="ps-item-subtitle">View your earned badges and milestones</span>
                                </div>
                            </div>
                        </div>

                        <div className="ps-list-item clickable-item" onClick={() => navigate('/insights')}>
                            <div className="ps-item-left">
                                <BarChart3 size={22} className="ps-icon-purple" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Insights</span>
                                    <span className="ps-item-subtitle">Performance analytics and trends</span>
                                </div>
                            </div>
                        </div>

                        <div className="ps-list-item clickable-item" onClick={() => navigate('/artist-dashboard')}>
                            <div className="ps-item-left">
                                <Layout size={22} className="ps-icon-purple" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Artist Dashboard</span>
                                    <span className="ps-item-subtitle">Manage your content and earnings</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ACCOUNT SECURITY SECTION */}
                <div className="ps-section">
                    <h3 className="ps-section-title">Account Security</h3>
                    <div className="ps-list-group">
                        
                        <div className="ps-list-item clickable-item" onClick={() => !user.isVerified && navigate('/verify/apply')}>
                            <div className="ps-item-left">
                                <BadgeCheck size={22} className={user.isVerified ? "ps-icon-purple" : "ps-icon-muted"} />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">{user.isVerified ? 'Verified Account (Official)' : 'Get Verified (Official)'}</span>
                                    {!user.isVerified && <span className="ps-item-subtitle">Request official verification</span>}
                                </div>
                            </div>
                            {user.isVerified && <Check size={20} className="ps-check-icon" />}
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

                        <div className="ps-list-item clickable-item" onClick={() => setShowPasswordModal(!showPasswordModal)}>
                            <div className="ps-item-left">
                                <Key size={22} className="ps-icon-purple" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Change Password</span>
                                    <span className="ps-item-subtitle">Update your login credentials</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* CHANGE PASSWORD INLINE FORM */}
                {showPasswordModal && (
                    <div className="ps-section ps-password-section">
                        <div className="ps-password-header">
                            <h4>Change Password</h4>
                            <button className="ps-pw-close" onClick={() => { setShowPasswordModal(false); setPwError(''); setPwSuccess(''); }}>
                                <X size={18} />
                            </button>
                        </div>
                        {pwSuccess ? (
                            <div className="ps-pw-success">
                                <Check size={20} />
                                <span>{pwSuccess}</span>
                            </div>
                        ) : (
                            <div className="ps-pw-form">
                                <div className="ps-pw-field">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="Current password"
                                        value={passwordForm.current}
                                        onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                                    />
                                    <button onClick={() => setShowPw(!showPw)} className="ps-pw-eye">
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <div className="ps-pw-field">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="New password"
                                        value={passwordForm.newPass}
                                        onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
                                    />
                                </div>
                                <div className="ps-pw-field">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="Confirm new password"
                                        value={passwordForm.confirm}
                                        onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                                    />
                                </div>
                                {pwError && <p className="ps-pw-error">{pwError}</p>}
                                <button className="ps-pw-submit" onClick={async () => {
                                    setPwError('');
                                    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) { setPwError('Please fill in all fields.'); return; }
                                    if (passwordForm.newPass !== passwordForm.confirm) { setPwError('Passwords do not match.'); return; }
                                    if (passwordForm.newPass.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
                                    try {
                                        const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ username: user.username, currentPassword: passwordForm.current, newPassword: passwordForm.newPass })
                                        });
                                        const data = await res.json();
                                        if (data.success) { setPwSuccess('Password updated successfully!'); setPasswordForm({ current: '', newPass: '', confirm: '' }); }
                                        else { setPwError(data.message || 'Incorrect current password.'); }
                                    } catch { setPwError('Network error. Please try again.'); }
                                }}>Update Password</button>
                            </div>
                        )}
                    </div>
                )}

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

                {/* HELP & SUPPORT SECTION */}
                <div className="ps-section">
                    <h3 className="ps-section-title">Help & Support</h3>
                    <div className="ps-list-group">
                        <div className="ps-list-item clickable-item" onClick={() => setIsSupportOpen(true)}>
                            <div className="ps-item-left">
                                <HelpCircle size={22} className="ps-icon-purple" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Support Hub</span>
                                    <span className="ps-item-subtitle">Report bugs or give feedback</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ABOUT & LEGAL SECTION */}
                <div className="ps-section">
                    <h3 className="ps-section-title">About & Legal</h3>
                    <div className="ps-list-group">
                        <div className="ps-list-item clickable-item" onClick={() => navigate('/legal?tab=tos')}>
                            <div className="ps-item-left">
                                <Shield size={22} className="ps-icon-muted" />
                                <div className="ps-item-text">
                                    <span className="ps-item-title">Terms of Service</span>
                                </div>
                            </div>
                        </div>
                        <div className="ps-list-item clickable-item" onClick={() => navigate('/legal?tab=privacy')}>
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
            <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
        </div>
    );
};

export default Settings;
