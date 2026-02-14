import { useState, useEffect, useRef } from 'react';
import { UserPlus, Settings, FolderPlus, Bell, LogOut, Search, X, Hash, User, BadgeCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import './ServerInteractions.css';

// --- Server Menu Component ---
// --- Server Menu Component ---
export const ServerMenu = ({ isOpen, onClose, onInvite, onSettings, onCreateChannel, onLeave }) => {
    const { showToast } = useToast();
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleAction = (e, callback) => {
        e.stopPropagation();
        if (callback) callback();
        onClose();
    };

    return (
        <div className="server-menu-dropdown" ref={menuRef} style={{ zIndex: 9999 }}>
            <div className="menu-item" onClick={(e) => handleAction(e, onInvite)}>
                <span>Invite People</span>
                <UserPlus size={16} />
            </div>
            <div className="menu-item" onClick={(e) => handleAction(e, onSettings)}>
                <span>Server Settings</span>
                <Settings size={16} />
            </div>
            <div className="menu-item" onClick={(e) => handleAction(e, onCreateChannel)}>
                <span>Create Channel</span>
                <FolderPlus size={16} />
            </div>
            <div className="menu-item" onClick={(e) => { e.stopPropagation(); showToast('Notifications Muted', 'success'); onClose(); }}>
                <span>Notification Settings</span>
                <Bell size={16} />
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
            <div className="menu-item danger" onClick={(e) => handleAction(e, onLeave)}>
                <span>Leave Server</span>
                <LogOut size={16} />
            </div>
        </div>
    );
};

// --- Members List Component ---
export const MembersList = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const onlineMembers = [];
    const offlineMembers = [];

    return (
        <div className="members-sidebar">
            <div className="members-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Members - {onlineMembers.length + offlineMembers.length}</span>
                <button className="icon-btn" onClick={onClose} title="Close Members List">
                    <X size={18} />
                </button>
            </div>
            <div className="members-list premium-scrollbar">
                <div className="member-category">
                    <h4>Online — {onlineMembers.length}</h4>
                    {onlineMembers.map(m => (
                        <div key={m.name} className="member-item">
                            <div className="member-avatar" style={{ backgroundImage: `url(${m.avatar})` }}>
                                <div className={`status-dot ${m.status}`} />
                            </div>
                            <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {m.name}
                                {m.isOfficial && <BadgeCheck size={12} color="var(--color-primary)" fill="var(--color-primary-glow)" />}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="member-category" style={{ marginTop: '1.5rem' }}>
                    <h4>Offline — {offlineMembers.length}</h4>
                    {offlineMembers.map(m => (
                        <div key={m.name} className="member-item" style={{ opacity: 0.5 }}>
                            <div className="member-avatar" style={{ backgroundImage: `url(${m.avatar})` }}>
                                <div className={`status-dot ${m.status}`} />
                            </div>
                            <span>{m.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Search Modal Component ---
export const SearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="search-modal-overlay" onClick={onClose}>
            <div className="search-modal" onClick={e => e.stopPropagation()}>
                <div className="search-input-wrapper">
                    <Search size={20} style={{ color: 'var(--text-secondary)' }} />
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder="Search messages, users, or channels..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>
                {query && (
                    <div className="search-results premium-scrollbar">
                        <div className="result-item">
                            <div className="result-header">
                                <span># general</span>
                                <span>Today</span>
                            </div>
                            <div>Matching message for "{query}"...</div>
                        </div>
                        <div className="result-item">
                            <div className="result-header">
                                <span>@alex_beats</span>
                                <span>User</span>
                            </div>
                            <div>Found user matching "{query}"</div>
                        </div>
                    </div>
                )}
                {!query && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>
                        Type to search across the server
                    </div>
                )}
            </div>
        </div>
    );
};
