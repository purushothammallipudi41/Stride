import { useState } from 'react';
import { X, Copy, Hash, Volume2, Check, Shield, User, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import './ServerInteractions.css'; // Re-use existing modal styles or add new ones

// --- Generic Modal Wrapper ---
const ModalWrapper = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="search-modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
            <div className="search-modal" onClick={e => e.stopPropagation()} style={{ width: '500px', maxWidth: '95vw', animation: 'scaleIn 0.2s ease' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{title}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div style={{ padding: '20px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Invite People Modal ---
export const InviteModal = ({ isOpen, onClose, serverName }) => {
    const { showToast } = useToast();
    const inviteLink = `https://stride.app/invite/${serverName.toLowerCase().replace(/\s/g, '-')}-${Math.floor(Math.random() * 1000)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        showToast('Invite link copied to clipboard!', 'success');
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Invite friends to ${serverName}`}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Share this link with others to grant them access to this server.
            </p>
            <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '8px' }}
                />
                <button onClick={handleCopy} className="primary-btn" style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--color-primary)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                    Copy
                </button>
            </div>
            <div style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Your invite link expires in 7 days.
            </div>
        </ModalWrapper>
    );
};

// --- Create Channel Modal ---
export const CreateChannelModal = ({ isOpen, onClose, onCreate }) => {
    const [channelName, setChannelName] = useState('');
    const [type, setType] = useState('text');

    const handleSubmit = () => {
        console.log('CreateChannelModal: handleSubmit called with:', { channelName, type });
        if (!channelName.trim()) {
            console.warn('CreateChannelModal: Channel name is empty');
            return;
        }
        try {
            onCreate({ name: channelName.toLowerCase().replace(/\s/g, '-'), type });
            console.log('CreateChannelModal: onCreate called successfully');
            setChannelName('');
            onClose();
        } catch (error) {
            console.error('CreateChannelModal: Error in onCreate callback:', error);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title="Create Channel">
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>CHANNEL TYPE</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                        onClick={() => setType('text')}
                        style={{ padding: '12px', borderRadius: '8px', background: type === 'text' ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        <Hash size={24} color="#b9bbbe" />
                        <div>
                            <div style={{ fontWeight: 600 }}>Text</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Send messages, images, GIFs, and opinions.</div>
                        </div>
                        {type === 'text' && <div style={{ marginLeft: 'auto', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '10px', height: '10px', background: 'var(--color-primary)', borderRadius: '50%' }} /></div>}
                    </div>
                    <div
                        onClick={() => setType('voice')}
                        style={{ padding: '12px', borderRadius: '8px', background: type === 'voice' ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        <Volume2 size={24} color="#b9bbbe" />
                        <div>
                            <div style={{ fontWeight: 600 }}>Voice</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hang out together with voice, video, and screen share.</div>
                        </div>
                        {type === 'voice' && <div style={{ marginLeft: 'auto', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '10px', height: '10px', background: 'var(--color-primary)', borderRadius: '50%' }} /></div>}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>CHANNEL NAME</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Hash size={16} color="var(--text-muted)" />
                    <input
                        type="text"
                        value={channelName}
                        onChange={e => setChannelName(e.target.value)}
                        placeholder="new-channel"
                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '10px' }}
                    />
                    {/* Debug indicator */}
                    {channelName && <Check size={16} color="#10b981" style={{ marginRight: '8px' }} />}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSubmit} style={{ background: 'var(--color-primary)', border: 'none', color: 'white', padding: '10px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Create Channel</button>
            </div>
        </ModalWrapper>
    );
};

// --- Server Settings Modal ---
export const ServerSettingsModal = ({ isOpen, onClose, server, onDelete, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [serverIcon, setServerIcon] = useState(null);
    const [serverName, setServerName] = useState(server.name);
    const [roles, setRoles] = useState([
        { id: 1, name: 'Administrator', color: '#eab308' },
        { id: 2, name: 'Member', color: '#3b82f6' }
    ]);

    // Update local state when server prop changes
    useState(() => {
        if (server) setServerName(server.name);
    }, [server]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setServerIcon(url);
        }
    };

    const handleSave = () => {
        if (onUpdate) {
            onUpdate({ name: serverName, icon: serverIcon }); // Pass icon if we were handling uploads appropriately
            onClose();
        }
    };

    // ... roles functions ...

    const handleAddRole = () => {
        const roleName = prompt("Enter role name:");
        if (roleName) {
            setRoles([...roles, { id: Date.now(), name: roleName, color: '#9ca3af' }]);
        }
    };

    const handleDeleteRole = (id) => {
        if (window.confirm("Delete this role?")) {
            setRoles(roles.filter(r => r.id !== id));
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title="Server Settings">
            <div style={{ display: 'flex', height: '400px' }}>
                <div style={{ width: '150px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '10px' }}>
                    {/* ... Tabs ... */}
                    {['Overview', 'Roles', 'Moderation'].map(tab => (
                        <div
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                                background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                                marginBottom: '4px'
                            }}
                        >
                            {tab}
                        </div>
                    ))}
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />
                    <div
                        style={{ padding: '8px 12px', color: '#ef4444', cursor: 'pointer' }}
                        onClick={() => {
                            if (onDelete) onDelete();
                        }}
                    >
                        Delete Server
                    </div>
                </div>
                <div style={{ flex: 1, paddingLeft: '20px', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '20px' }}>{activeTab}</h4>
                    {activeTab === 'Overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div
                                    onClick={() => document.getElementById('server-icon-upload').click()}
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: serverIcon ? `url(${serverIcon}) center/cover` : 'var(--color-surface)',
                                        border: '2px dashed var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        flexShrink: 0
                                    }}>
                                    {!serverIcon && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Upload</span>}
                                    <input
                                        id="server-icon-upload"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.8rem' }}>SERVER NAME</label>
                                    <input
                                        type="text"
                                        value={serverName}
                                        onChange={(e) => setServerName(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleSave}
                                    className="primary-btn"
                                    style={{ padding: '10px 24px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'Roles' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                                <button
                                    onClick={handleAddRole}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        background: 'var(--color-primary)', border: 'none', borderRadius: '4px',
                                        padding: '6px 12px', color: 'white', cursor: 'pointer', fontSize: '0.8rem'
                                    }}
                                >
                                    <span>Add Role</span>
                                </button>
                            </div>
                            <div className="premium-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                                {roles.map(role => (
                                    <div key={role.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Shield size={16} color={role.color} />
                                            <span>{role.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>0 members</span>
                                            <button
                                                className="icon-btn"
                                                onClick={() => handleDeleteRole(role.id)}
                                                style={{ color: '#ef4444', opacity: 0.7 }}
                                                title="Delete Role"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModalWrapper>
    );
};

// --- Server Profile Modal ---
export const ServerProfileModal = ({ isOpen, onClose, serverName, currentNickname, onSave }) => {
    const [nickname, setNickname] = useState(currentNickname || '');

    // Reset nickname when modal opens or prop changes
    useState(() => {
        if (isOpen) setNickname(currentNickname || '');
    }, [isOpen, currentNickname]);

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Edit Profile for ${serverName}`}>
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>NICKNAME</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <User size={16} color="var(--text-muted)" />
                    <input
                        type="text"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        placeholder="Server Nickname"
                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '10px' }}
                    />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => onSave(nickname)} style={{ background: 'var(--color-primary)', border: 'none', color: 'white', padding: '10px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            </div>
        </ModalWrapper>
    );
};
