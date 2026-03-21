import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Bell, Shield, User, LogOut, ChevronRight } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const [theme, setTheme] = useState('dark');
    const [notifications, setNotifications] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    return (
        <div className="settings-container animate-fade-in">
            <PageHeader 
                title="Settings" 
                leftElement={<button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>}
            />
            
            <div className="settings-content">
                <div className="settings-section">
                    <h3>Account</h3>
                    <div className="settings-list">
                        <div className="settings-item" onClick={() => navigate('/profile?edit=true')}>
                            <div className="settings-item-left">
                                <User size={20} className="settings-icon" />
                                <span>Edit Profile</span>
                            </div>
                            <ChevronRight size={18} className="settings-chevron" />
                        </div>
                        <div className="settings-item">
                            <div className="settings-item-left">
                                <Shield size={20} className="settings-icon" />
                                <span>Privacy & Security</span>
                            </div>
                            <ChevronRight size={18} className="settings-chevron" />
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Preferences</h3>
                    <div className="settings-list">
                        <div className="settings-item toggle-item">
                            <div className="settings-item-left">
                                <Moon size={20} className="settings-icon" />
                                <span>Dark Mode</span>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={theme === 'dark'} onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div className="settings-item toggle-item">
                            <div className="settings-item-left">
                                <Bell size={20} className="settings-icon" />
                                <span>Push Notifications</span>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <button className="settings-logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Log Out</span>
                    </button>
                    
                    <div className="settings-footer">
                        <p>Stride v1.0.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
