import { useState, useEffect } from 'react';
import { X, Trash2, Save, Palette, Type, Info, Zap, Shield, ChevronRight, ImagePlus, ClipboardList, Sticker, Smile, FileClock, Users2, Key, Ban, Link, ShieldAlert, Copy, Check, Hash, ChevronLeft, FilePlus, Layout, Music2, Plus } from 'lucide-react';
import { BASE_URL } from '../../utils/api';
import { getStoredUser } from '../../utils/storage';
import { useUI } from '../../hooks/useUI';
import Avatar from '../common/Avatar';

const ModToolsModal = ({ isOpen, onClose, community, onUpdate }) => {
    // 1. Always call Hooks at the top level
    const [currentView, setCurrentView] = useState('main');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [accentColor, setAccentColor] = useState('#8b5cf6');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    
    // Mock Settings State for Toggles
    const [settings, setSettings] = useState({
        hideMuted: false,
        allowDMs: true,
        allowRequests: true,
        verificationLevel: 'medium',
        explicitContentFilter: true
    });

    const [invites, setInvites] = useState([
        { code: 'stride-vibe', uses: 124, expires: 'Never' },
        { code: 'genesis-drop', uses: 42, expires: '24h' },
        { code: 'mod-private', uses: 3, expires: '1h' }
    ]);

    const [bans, setBans] = useState([
        { username: 'SpamBot99', reason: 'Api abuse', date: '2d ago' },
        { username: 'Faker0x', reason: 'Identity theft', date: '1w ago' }
    ]);

    const user = getStoredUser();
    const { addNotification } = useUI();

    // Reset state only when the modal opens for the first time
    useEffect(() => {
        if (isOpen) {
            console.log("[SETTINGS] Node Config Active:", community?.name);
            setName(community?.name || '');
            setDescription(community?.description || '');
            setAccentColor(community?.accentColor || '#8b5cf6');
            setCurrentView('main');
        }
    }, [isOpen]); 

    // 2. Early return after hooks
    if (!isOpen) return null;

    const handleSave = async () => {
        const communityId = community?._id || community?.id;
        
        if (!communityId) {
            console.error("[SETTINGS] CRITICAL: No Community ID found for update.", community);
            addNotification({ title: 'System Error', message: 'Could not identify this community node. Please refresh.', type: 'error' });
            return;
        }

        setIsSaving(true);
        console.log(`[SETTINGS] Dispatching sovereignty update for ${communityId}...`);
        
        try {
            const res = await fetch(`${BASE_URL}/api/communities/${communityId}/settings`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-username': user.username
                },
                body: JSON.stringify({ name, description, accentColor, settings })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Server responded with ${res.status}`);
            }

            const data = await res.json();
            if (data.success || data.community) {
                onUpdate(data.community || { ...community, name, description, accentColor, settings });
                addNotification({ title: 'Shift Confirmed', message: 'Community settings updated successfully.', type: 'success' });
                setCurrentView('main');
            }
        } catch (err) {
            console.error("[SETTINGS] Failed to update sovereignty settings:", err);
            addNotification({ title: 'Save Failed', message: err.message || 'Could not update community node.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        setIsDeleting(true);
        try {
            const res = await fetch(`${BASE_URL}/api/communities/${community._id}`, {
                method: 'DELETE',
                headers: { 
                    'x-user-username': user.username
                }
            });
            if (res.ok) {
                window.location.href = '/explore';
            }
        } catch (err) {
            console.error("Failed to decommission node:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleSetting = (key) => {
        console.log(`[SETTINGS] Toggling ${key}...`);
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const placeholderAction = (label) => {
        console.log(`[SETTINGS] ${label} placeholder triggered.`);
        addNotification({ 
            title: 'Sub-module Offline', 
            message: `The ${label} interface is scheduled for the Stride 3.2 release.`, 
            type: 'info' 
        });
    };

    const colors = ['#8b5cf6', '#ec4899', '#ef4444', '#10b981', '#3b82f6', '#f59e0b'];

    // --- Dynamic Title Resolver ---
    const getTitle = () => {
        switch(currentView) {
            case 'overview': return 'Overview';
            case 'members': return 'Members';
            case 'moderation': return 'Moderation';
            case 'audit-log': return 'Audit Log';
            case 'channels': return 'Channels';
            case 'integrations': return 'Apps & Integrations';
            case 'emoji': return 'Emoji';
            case 'stickers': return 'Stickers';
            case 'soundboard': return 'Soundboard';
            case 'roles': return 'Roles';
            case 'invites': return 'Invites';
            case 'bans': return 'Bans';
            case 'widgets': return 'Server Widget';
            case 'template': return 'Server Template';
            default: return 'Server Settings';
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)' }}>
            <div className="modal-content" style={{ 
                maxWidth: '100%', 
                width: '100%', 
                height: '100%', 
                padding: '0', 
                borderRadius: '0', 
                background: '#000', 
                display: 'flex', 
                flexDirection: 'column', 
                '--token-accent': accentColor,
                pointerEvents: 'auto'
            }}>
                
                {/* Fixed Dynamic Header */}
                <header style={{ 
                    padding: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    background: '#0a0a0b', 
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {currentView !== 'main' ? (
                            <button 
                                onClick={() => { console.log("[NAV] Returning to Main..."); setCurrentView('main'); }} 
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                        ) : (
                            <button 
                                onClick={onClose} 
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}
                            >
                                <X size={20} />
                            </button>
                        )}
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, tracking: 'tight' }}>{getTitle()}</h2>
                    </div>
                    {currentView === 'overview' && (
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            style={{ background: accentColor, border: 'none', color: 'white', fontWeight: '800', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
                        >
                            {isSaving ? '...' : 'Save'}
                        </button>
                    )}
                </header>

                <div className="settings-scroller" style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
                    
                    {/* --- VIEW: MAIN --- */}
                    {currentView === 'main' && (
                        <>
                            <div className="mod-avatar-header" style={{ padding: '32px 16px' }}>
                                <div className="mod-avatar-wrapper">
                                    <Avatar src={community?.avatar} size={90} frame="none" />
                                    <div className="mod-edit-overlay">
                                        <ImagePlus size={18} />
                                    </div>
                                </div>
                                <h3 className="mod-community-name-display" style={{ marginTop: '16px', fontSize: '1.4rem' }}>{community?.name}</h3>
                            </div>

                            <div className="settings-section">
                                <h4 className="settings-section-title">Administrative</h4>
                                <div className="settings-section-card">
                                    <SettingsItem 
                                        icon={Plus} 
                                        label="Establish New Community" 
                                        onClick={() => {
                                            onClose();
                                            openCreateModal('COMMUNITY');
                                        }} 
                                        labelColor="var(--token-accent)"
                                    />
                                </div>
                            </div>

                            <div className="settings-section">
                                <h4 className="settings-section-title">Common Settings</h4>
                                <div className="settings-section-card">
                                    <SettingsItem icon={Info} label="Overview" onClick={() => setCurrentView('overview')} />
                                    <SettingsItem icon={Shield} label="Moderation" onClick={() => setCurrentView('moderation')} />
                                    <SettingsItem icon={ClipboardList} label="Audit Log" onClick={() => setCurrentView('audit-log')} />
                                    <SettingsItem icon={Hash} label="Channels" onClick={() => setCurrentView('channels')} />
                                    <SettingsItem icon={Zap} label="Integrations" onClick={() => setCurrentView('integrations')} />
                                    <SettingsItem icon={Smile} label="Emoji" onClick={() => setCurrentView('emoji')} />
                                    <SettingsItem icon={Sticker} label="Stickers" onClick={() => setCurrentView('stickers')} />
                                    <SettingsItem icon={FilePlus} label="Soundboard" onClick={() => setCurrentView('soundboard')} />
                                </div>
                            </div>

                            <div className="settings-section">
                                <h4 className="settings-section-title">User Management</h4>
                                <div className="settings-section-card">
                                    <SettingsItem icon={Users2} label="Members" onClick={() => setCurrentView('members')} />
                                    <SettingsItem icon={Shield} label="Roles" onClick={() => setCurrentView('roles')} />
                                    <SettingsItem icon={Link} label="Invites" onClick={() => setCurrentView('invites')} />
                                    <SettingsItem icon={Ban} label="Bans" onClick={() => setCurrentView('bans')} />
                                </div>
                            </div>

                            <div className="settings-section">
                                <h4 className="settings-section-title">Community Growth</h4>
                                <div className="settings-section-card">
                                    <SettingsItem icon={Layout} label="Server Widget" onClick={() => setCurrentView('widgets')} />
                                    <SettingsItem icon={FilePlus} label="Server Template" onClick={() => setCurrentView('template')} />
                                    <SettingsItem icon={Key} label="Custom Invite Link" onClick={() => placeholderAction('Custom Link')} />
                                </div>
                            </div>

                            <div className="settings-section">
                                <h4 className="settings-section-title">Privacy & Safety</h4>
                                <div className="settings-section-card">
                                    <SettingsItem 
                                        label="Hide Muted Channels" 
                                        toggle 
                                        isOn={settings.hideMuted} 
                                        onToggle={() => toggleSetting('hideMuted')} 
                                    />
                                    <SettingsItem 
                                        label="Allow Direct Messages" 
                                        sub="Global setting for all server members"
                                        toggle 
                                        isOn={settings.allowDMs} 
                                        onToggle={() => toggleSetting('allowDMs')} 
                                    />
                                    <SettingsItem icon={ShieldAlert} label="Report Server" onClick={() => placeholderAction('Reporting')} />
                                    <SettingsItem icon={Shield} label="Security Actions" labelColor="#ef4444" onClick={() => placeholderAction('Security')} />
                                </div>
                            </div>

                            <div className="settings-section" style={{ marginTop: 'auto', paddingTop: '40px' }}>
                                <div className="settings-section-card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                    <SettingsItem 
                                        label={isDeleting ? 'Decommissioning...' : confirmDelete ? 'Confirm Permanent Deletion' : 'Delete Community'}
                                        labelColor="#ef4444"
                                        icon={Trash2}
                                        onClick={handleDelete}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- VIEW: OVERVIEW --- */}
                    {currentView === 'overview' && (
                        <div style={{ padding: '24px 16px' }}>
                            <div className="settings-section">
                                <h4 className="settings-section-title">Server Identity</h4>
                                <div className="settings-section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: '800', tracking: 'widest' }}>SERVER NAME</label>
                                        <input 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter community name..."
                                            style={{ background: '#111214', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '14px', color: 'white', fontSize: '1rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: '800', tracking: 'widest' }}>DESCRIPTION</label>
                                        <textarea 
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={5}
                                            placeholder="Share the vibe of this node..."
                                            style={{ background: '#111214', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '14px', color: 'white', fontSize: '0.95rem', resize: 'none', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="settings-section" style={{ marginTop: '32px' }}>
                                <h4 className="settings-section-title">Branding Color</h4>
                                <div className="settings-section-card" style={{ padding: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '20px', opacity: 0.5, fontSize: '0.75rem', fontWeight: '800' }}>COMMUNITY ACCENT</label>
                                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                        {colors.map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => { console.log("[UI] Color Select:", c); setAccentColor(c); }}
                                                style={{ 
                                                    width: '44px', 
                                                    height: '44px', 
                                                    borderRadius: '14px', 
                                                    background: c, 
                                                    border: accentColor === c ? '3px solid white' : 'none',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s',
                                                    transform: accentColor === c ? 'scale(1.1)' : 'scale(1)'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: MEMBERS --- */}
                    {currentView === 'members' && (
                        <div style={{ padding: '24px 16px' }}>
                            <h4 className="settings-section-title">Node Inhabitants ({community?.members?.length || 0})</h4>
                            <div className="settings-section-card">
                                {(community?.members || []).map((m, i) => (
                                    <div key={i} className="settings-item" style={{ cursor: 'default', padding: '12px 16px' }}>
                                        <div className="settings-item-left">
                                            <Avatar src={m.avatar || m.username?.[0]} size={36} frame="none" />
                                            <div style={{ marginLeft: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{m.username || 'Ghost Viber'}</span>
                                                    {m.username === community.author && <Shield size={14} color="#f59e0b" fill="#f59e0b" />}
                                                </div>
                                                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{m.username === community.author ? 'Primary Mod / Founder' : 'Nexus Member'}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} opacity={0.2} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: MODERATION --- */}
                    {currentView === 'moderation' && (
                        <div style={{ padding: '24px 16px' }}>
                            <div className="settings-section">
                                <h4 className="settings-section-title">Safety Levels</h4>
                                <div className="settings-section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {['None', 'Low', 'Medium', 'High'].map(level => (
                                        <div 
                                            key={level} 
                                            onClick={() => setSettings(s => ({ ...s, verificationLevel: level.toLowerCase() }))}
                                            style={{ 
                                                padding: '16px', 
                                                borderRadius: '12px', 
                                                background: settings.verificationLevel === level.toLowerCase() ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${settings.verificationLevel === level.toLowerCase() ? '#8b5cf6' : 'rgba(255,255,255,0.05)'}`,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '4px' }}>{level.toUpperCase()}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Verification required for members to chat in this node.</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: AUDIT LOG --- */}
                    {currentView === 'audit-log' && (
                        <div style={{ padding: '24px 16px' }}>
                            <div className="settings-section">
                                <h4 className="settings-section-title">Interaction History</h4>
                                <div className="settings-section-card">
                                    {[
                                        { action: 'Role Updated', target: 'Vibe King', mod: 'puru', time: '12m ago' },
                                        { action: 'Channel Created', target: '#backstage', mod: 'puru', time: '1h ago' },
                                        { action: 'Member Kicked', target: 'SpamBot', mod: 'AutoMod', time: '3h ago' },
                                        { action: 'Node Profile Changed', target: 'Stride Official', mod: 'puru', time: '5h ago' }
                                    ].map((log, i) => (
                                        <div key={i} className="settings-item" style={{ cursor: 'default', padding: '16px' }}>
                                            <div className="settings-item-left">
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FileClock size={16} opacity={0.6} />
                                                </div>
                                                <div style={{ marginLeft: '4px' }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{log.action}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{log.mod} modified {log.target}</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.3 }}>{log.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: INVITES --- */}
                    {currentView === 'invites' && (
                        <div style={{ padding: '24px 16px' }}>
                            <h4 className="settings-section-title">Active Flux Gates ({invites.length})</h4>
                            <div className="settings-section-card">
                                {invites.map((inv, i) => (
                                    <div key={i} className="settings-item" style={{ padding: '16px' }}>
                                        <div className="settings-item-left">
                                            <div style={{ fontWeight: '800', color: accentColor }}>{inv.code}</div>
                                            <div style={{ marginLeft: '12px', fontSize: '0.75rem', opacity: 0.5 }}>{inv.uses} uses • {inv.expires}</div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setInvites(prev => prev.filter((_, idx) => idx !== i));
                                                addNotification({ title: 'Gate Revoked', message: 'Invite code decommissioned.', type: 'info' });
                                            }}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: BANS --- */}
                    {currentView === 'bans' && (
                        <div style={{ padding: '24px 16px' }}>
                            <h4 className="settings-section-title">Decommissioned Users ({bans.length})</h4>
                            <div className="settings-section-card">
                                {bans.map((b, i) => (
                                    <div key={i} className="settings-item" style={{ padding: '16px' }}>
                                        <div className="settings-item-left">
                                            <Avatar src={b.username[0]} size={32} frame="none" />
                                            <div style={{ marginLeft: '4px' }}>
                                                <div style={{ fontWeight: '700' }}>{b.username}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{b.reason} • {b.date}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setBans(prev => prev.filter((_, idx) => idx !== i));
                                                addNotification({ title: 'Restored', message: `${b.username} unbanned from site.`, type: 'success' });
                                            }}
                                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}
                                        >
                                            Unban
                                        </button>
                                    </div>
                                ))}
                                {bans.length === 0 && <div style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>No nodes currently restricted.</div>}
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: ROLES --- */}
                    {currentView === 'roles' && (
                        <div style={{ padding: '24px 16px' }}>
                            <h4 className="settings-section-title">Node Hierarchy</h4>
                            <div className="settings-section-card">
                                {[
                                    { name: 'Owner', members: 1, color: '#f59e0b' },
                                    { name: 'Moderator', members: 3, color: '#10b981' },
                                    { name: 'Beta Tester', members: 12, color: '#3b82f6' },
                                    { name: 'Member', members: 156, color: '#9ca3af' }
                                ].map((role, i) => (
                                    <div key={i} className="settings-item" style={{ padding: '16px' }}>
                                        <div className="settings-item-left">
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: role.color }} />
                                            <div style={{ marginLeft: '12px', fontWeight: '700' }}>{role.name}</div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{role.members}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: SOUNDBOARD --- */}
                    {currentView === 'soundboard' && (
                        <div style={{ padding: '24px 16px' }}>
                            <h4 className="settings-section-title">Audio Arsenal</h4>
                            <button className="create-event-btn" style={{ width: '100%', marginBottom: '20px', background: accentColor }}>Upload Sound</button>
                            <div className="settings-section-card">
                                {[
                                    { name: 'Vinyl Scratch', author: 'puru', size: '1.2MB' },
                                    { name: 'Airmask Hiss', author: 'puru', size: '400KB' },
                                    { name: 'Cyber Horn', author: 'AutoMod', size: '2.1MB' }
                                ].map((sound, i) => (
                                    <div key={i} className="settings-item" style={{ padding: '16px' }}>
                                        <div className="settings-item-left">
                                            <Music2 size={16} opacity={0.5} />
                                            <div style={{ marginLeft: '12px', fontWeight: '700' }}>{sound.name}</div>
                                        </div>
                                        <Trash2 size={16} opacity={0.2} style={{ cursor: 'pointer' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: TEMPLATES --- */}
                    {currentView === 'template' && (
                        <div style={{ padding: '24px 16px' }}>
                            <h4 className="settings-section-title">Node Blueprint</h4>
                            <div className="settings-section-card" style={{ padding: '24px', textAlign: 'center' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <FilePlus size={32} opacity={0.5} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px' }}>Sync Active Node</h3>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '24px' }}>Generate a structural clone of "${community.name}" including channels, roles, and permissions.</p>
                                <button 
                                    onClick={() => addNotification({ title: 'Template Synced', message: 'Node blueprint is now available for deployment.', type: 'success' })}
                                    style={{ width: '100%', background: accentColor, border: 'none', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: '800' }}
                                >
                                    Generate Template
                                </button>
                            </div>
                        </div>
                    )}
                    {currentView === 'widgets' && (
                        <div style={{ padding: '24px 16px' }}>
                            <h4 className="settings-section-title">Web Presence</h4>
                            <div className="settings-section-card" style={{ padding: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.5, marginBottom: '8px', fontWeight: '800' }}>IFRAME EMBED CODE</label>
                                <textarea 
                                    readOnly 
                                    value={`<iframe src="https://stride.live/widget/${community._id}" width="350" height="500"></iframe>`}
                                    style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#10b981', fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '16px', resize: 'none' }}
                                />
                                <button 
                                    onClick={() => addNotification({ title: 'Copied', message: 'Widget code saved to clipboard.', type: 'success' })}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: '800' }}
                                >
                                    Copy Code
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Helper: Interactive Settings Item ---
const SettingsItem = ({ icon: Icon, label, sub, toggle, isOn, onToggle, onClick, labelColor }) => {
    return (
        <div 
            className="settings-item" 
            onClick={(e) => {
                console.log(`[CLICK] Interaction detected on: ${label}`);
                if (onClick) onClick(e);
            }}
            style={{ 
                cursor: 'pointer',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent'
            }}
        >
            <div className="settings-item-left">
                {Icon && <Icon size={20} opacity={0.7} style={{ color: labelColor || 'inherit' }} />}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="settings-item-label" style={{ color: labelColor || 'white', fontWeight: '500' }}>{label}</span>
                    {sub && <span className="settings-item-sub" style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '2px' }}>{sub}</span>}
                </div>
            </div>
            
            {toggle ? (
                <div className={`stride-toggle ${isOn ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                    <div className="stride-toggle-handle">
                        {isOn && <Check size={12} className="toggle-check-icon" />}
                    </div>
                </div>
            ) : (
                <ChevronRight size={18} opacity={0.4} />
            )}
        </div>
    );
};

export default ModToolsModal;
