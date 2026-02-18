import { useState, useEffect, useRef } from 'react';
import { UserPlus, Settings, FolderPlus, Bell, LogOut, Search, X, Hash, User, BadgeCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import './ServerInteractions.css';

// --- Server Menu Component ---
// --- Server Menu Component ---
export const ServerMenu = ({ isOpen, onClose, onInvite, onSettings, onCreateChannel, onLeave, canInvite, canManageServer, canManageChannels }) => {
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
            {canInvite && (
                <div className="menu-item" onClick={(e) => handleAction(e, onInvite)}>
                    <span>Invite People</span>
                    <UserPlus size={16} />
                </div>
            )}
            {canManageServer && (
                <div className="menu-item" onClick={(e) => handleAction(e, onSettings)}>
                    <span>Server Settings</span>
                    <Settings size={16} />
                </div>
            )}
            {canManageChannels && (
                <div className="menu-item" onClick={(e) => handleAction(e, onCreateChannel)}>
                    <span>Create Channel</span>
                    <FolderPlus size={16} />
                </div>
            )}
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

// --- MembersList Component ---
import { useServer } from '../../context/ServerContext';
import { useSocket } from '../../context/SocketContext';

export const MembersList = ({ isOpen, onClose, members = [], onMemberClick }) => {
    if (!isOpen) return null;

    const onlineMembers = members.filter(m => m.status === 'online');
    const offlineMembers = members.filter(m => m.status === 'offline' || !m.status);

    return (
        <div className="members-sidebar">
            <div className="members-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Members - {members.length}</span>
                <button className="icon-btn" onClick={onClose} title="Close Members List">
                    <X size={18} />
                </button>
            </div>

            <div className="members-list premium-scrollbar">
                <div className="member-category">
                    <h4 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '8px', paddingLeft: '8px' }}>Online — {onlineMembers.length}</h4>
                    {onlineMembers.map(m => (
                        <div key={m.id} className="member-item" onClick={() => onMemberClick && onMemberClick(m)} style={{ cursor: onMemberClick ? 'pointer' : 'default' }}>
                            <div className="member-avatar" style={{ backgroundImage: `url(${m.avatar || '/default-avatar.png'})` }}>
                                <div className="status-dot online" />
                            </div>
                            <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                                {m.nickname || m.username}
                                {m.isOfficial && <BadgeCheck size={12} color="var(--color-primary)" fill="var(--color-primary)" />}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="member-category" style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '8px', paddingLeft: '8px' }}>Offline — {offlineMembers.length}</h4>
                    {offlineMembers.map(m => (
                        <div key={m.id} className="member-item" onClick={() => onMemberClick && onMemberClick(m)} style={{ opacity: 0.5, cursor: onMemberClick ? 'pointer' : 'default' }}>
                            <div className="member-avatar" style={{ backgroundImage: `url(${m.avatar || '/default-avatar.png'})` }}>
                                <div className="status-dot offline" />
                            </div>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                                {m.nickname || m.username}
                                {m.isOfficial && <BadgeCheck size={12} color="var(--text-secondary)" />}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Search Modal Component ---
export const SearchModal = ({ isOpen, onClose, channels = [], members = [] }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredChannels = channels.filter(ch => ch.toLowerCase().includes(query.toLowerCase()));
    const filteredMembers = members.filter(m => (m.nickname || m.username).toLowerCase().includes(query.toLowerCase()));

    const hasResults = filteredChannels.length > 0 || filteredMembers.length > 0;

    return (
        <div className="search-modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
            <div className="search-modal glass-card" onClick={e => e.stopPropagation()} style={{ width: '480px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                <div className="search-input-wrapper" style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Search size={20} style={{ color: 'var(--text-secondary)' }} />
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder="Search messages, users, or channels..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ border: 'none', background: 'transparent', color: 'white', flex: 1, fontSize: '1rem', outline: 'none', padding: '0 12px' }}
                    />
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="search-results premium-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', padding: '12px' }}>
                    {query && hasResults ? (
                        <>
                            {filteredChannels.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '8px' }}>Channels</div>
                                    {filteredChannels.map(ch => (
                                        <div key={ch} className="menu-item" style={{ gap: '10px' }} onClick={onClose}>
                                            <Hash size={16} />
                                            <span>{ch}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {filteredMembers.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '8px' }}>Members</div>
                                    {filteredMembers.map(m => (
                                        <div key={m.id} className="menu-item" style={{ gap: '10px' }} onClick={onClose}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: `url(${m.avatar || '/default-avatar.png'}) center/cover` }} />
                                            <span>{m.nickname || m.username}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : query ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', opacity: 0.6 }}>
                            Type to search channels and members...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
