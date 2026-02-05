import { useNavigate } from 'react-router-dom';
import { UserPlus, LogOut, Shield, Bell, Globe, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const settingGroups = [
        {
            title: 'Account',
            items: [
                { icon: UserPlus, label: 'Add Account', action: handleLogout, color: 'var(--color-primary)' },
                { icon: Shield, label: 'Privacy & Security' },
                { icon: Bell, label: 'Notifications' },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { icon: Globe, label: 'Language' },
                { icon: Moon, label: 'Dark Mode', isToggle: true },
            ]
        },
        {
            items: [
                { icon: LogOut, label: 'Logout', action: handleLogout, color: 'var(--color-danger)' },
            ]
        }
    ];

    return (
        <div className="settings-container">
            <header className="settings-header">
                <h2>Settings</h2>
            </header>

            <div className="settings-content">
                {settingGroups.map((group, gIdx) => (
                    <div key={gIdx} className="settings-group">
                        {group.title && <h3>{group.title}</h3>}
                        <div className="settings-list">
                            {group.items.map((item, iIdx) => (
                                <div
                                    key={iIdx}
                                    className="settings-item"
                                    onClick={item.action}
                                    style={{ color: item.color }}
                                >
                                    <div className="settings-item-left">
                                        <item.icon size={20} />
                                        <span>{item.label}</span>
                                    </div>
                                    {!item.action && !item.isToggle && <div className="chevron-right">›</div>}
                                    {item.isToggle && <div className="toggle-switch active"></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Settings;
