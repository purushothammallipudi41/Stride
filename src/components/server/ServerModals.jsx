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
export const ServerSettingsModal = ({ isOpen, onClose, server }) => {
    const [activeTab, setActiveTab] = useState('Overview');

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title="Server Settings">
            <div style={{ display: 'flex', height: '400px' }}>
                <div style={{ width: '150px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '10px' }}>
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
                    <div style={{ padding: '8px 12px', color: '#ef4444', cursor: 'pointer' }}>Delete Server</div>
                </div>
                <div style={{ flex: 1, paddingLeft: '20px' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '20px' }}>{activeTab}</h4>
                    {activeTab === 'Overview' && (
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-surface)', border: '2px dashed var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Upload</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.8rem' }}>SERVER NAME</label>
                                <input type="text" defaultValue={server.name} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'Roles' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Shield size={16} color="#eab308" />
                                    <span>Administrator</span>
                                </div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>2 members</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <User size={16} color="#3b82f6" />
                                    <span>Member</span>
                                </div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>14 members</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModalWrapper>
    );
};
