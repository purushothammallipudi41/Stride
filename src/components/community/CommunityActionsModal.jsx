import React, { useState, useEffect } from 'react';
import { X, Plus, Hash, FilePlus, UserCircle, BellOff, MessageSquare, ShieldAlert, Trash2, ChevronRight, Copy, Check, Settings, Shield, ChevronLeft } from 'lucide-react';
import { useUI } from '../../hooks/useUI';

const CommunityActionsModal = ({ isOpen, onClose, community, onOpenSettings, onCopyId, isMod, onTogglePreference }) => {
    const { addNotification } = useUI();
    const [view, setView] = useState('main');
    const [newItemName, setNewItemName] = useState('');
    const [settings, setSettings] = useState({
        hideMuted: community?.prefs?.hideMuted || false,
        allowDMs: community?.prefs?.allowDMs || true,
        allowRequests: community?.prefs?.allowRequests || true
    });

    // Reset view when opening
    useEffect(() => {
        if (isOpen) setView('main');
    }, [isOpen]);

    if (!isOpen) return null;

    const toggleSetting = (key) => {
        const newValue = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newValue }));
        if (onTogglePreference) onTogglePreference(key, newValue);
    };

    const handleQuickCreate = (type) => {
        if (!newItemName.trim()) {
            addNotification({ title: 'Input Required', message: `Please enter a name for the ${type}.`, type: 'error' });
            return;
        }
        
        console.log(`[QUICK-ACTION] Creating ${type}: ${newItemName}`);
        addNotification({ 
            title: 'Action Registered', 
            message: `${type} "${newItemName}" is being synced with the node.`, 
            type: 'success' 
        });
        
        // In a real app, this would hit /api/communities/:id/channels or /events
        setNewItemName('');
        setView('main');
        onClose();
    };

    const renderMainView = () => (
        <>
            {/* Group: Quick Actions */}
            <div className="action-sheet-group">
                <ActionItem icon={Hash} label="Create Category" onClick={() => setView('create-category')} />
                <ActionItem icon={Plus} label="Create Event" onClick={() => setView('create-event')} />
            </div>

            {/* Group: Preferences & Privacy */}
            <div className="action-sheet-group">
                <ActionItem icon={UserCircle} label="Edit Per-server Profile" onClick={() => addNotification({ title: 'Sub-module', message: 'Profile editor opening...', type: 'info' })} />
                
                <ActionItem 
                    label="Hide Muted Channels" 
                    toggle 
                    isOn={settings.hideMuted} 
                    onToggle={() => toggleSetting('hideMuted')} 
                />
                
                <ActionItem 
                    label="Allow Direct Messages" 
                    sub="Anyone in the server can message you"
                    toggle 
                    isOn={settings.allowDMs} 
                    onToggle={() => toggleSetting('allowDMs')} 
                />
                
                <ActionItem 
                    label="Allow Message Requests" 
                    sub="Filter messages from members you may not know"
                    toggle 
                    isOn={settings.allowRequests} 
                    onToggle={() => toggleSetting('allowRequests')} 
                />

                <ActionItem 
                    icon={Settings} 
                    label="Server Settings" 
                    onClick={onOpenSettings} 
                    accent 
                />
            </div>
        </>
    );

    const renderCreateView = (type) => (
        <div style={{ padding: '0 8px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button 
                    onClick={() => setView('main')}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', display: 'flex' }}
                >
                    <ChevronLeft size={20} />
                </button>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Create {type}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: '800' }}>{type.toUpperCase()} NAME</label>
                <input 
                    autoFocus
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`Enter ${type} name...`}
                    style={{ background: '#1e1f22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', color: 'white', fontSize: '1rem', outline: 'none' }}
                />
                <button 
                    onClick={() => handleQuickCreate(type)}
                    style={{ background: 'var(--token-accent, #8b5cf6)', border: 'none', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: '800', marginTop: '12px' }}
                >
                    Create {type}
                </button>
            </div>
        </div>
    );

    return (
        <div className="action-sheet-overlay" onClick={onClose}>
            <div className="action-sheet-content" onClick={(e) => e.stopPropagation()}>
                <div className="action-sheet-drag-handle" />
                
                {/* Community Header */}
                {view === 'main' && (
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 24px 8px', color: '#fff' }}>
                        {community.name}
                    </h2>
                )}

                {view === 'main' && renderMainView()}
                {view === 'create-category' && renderCreateView('Category')}
                {view === 'create-event' && renderCreateView('Event')}

                {view === 'main' && (
                    <button 
                        onClick={onClose}
                        style={{ 
                            width: '100%', 
                            padding: '16px', 
                            background: 'rgba(255,255,255,0.05)', 
                            border: 'none', 
                            borderRadius: '16px', 
                            color: 'white', 
                            fontWeight: '700',
                            marginTop: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
};

const ActionItem = ({ icon: Icon, label, sub, toggle, isOn, onToggle, onClick, labelColor, accent }) => {
    const handleItemClick = (e) => {
        if (toggle && onToggle) {
            onToggle();
        } else if (onClick) {
            onClick(e);
        }
    };

    return (
        <div className="action-sheet-item" onClick={handleItemClick}>
            <div className="action-sheet-label">
                {Icon && <Icon size={20} opacity={0.7} style={{ color: labelColor || (accent ? 'var(--token-accent)' : 'inherit') }} />}
                <div>
                    <span style={{ color: labelColor || 'white' }}>{label}</span>
                    {sub && <span className="action-sheet-subtitle">{sub}</span>}
                </div>
            </div>
            {toggle ? (
                <div className={`stride-toggle ${isOn ? 'on' : ''}`}>
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

export default CommunityActionsModal;
