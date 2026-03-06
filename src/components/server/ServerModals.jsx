import { useState, useEffect } from 'react';
import { X, Copy, Hash, Volume2, Check, Shield, User, Trash2, ArrowLeft, Plus, Search, Gamepad2, GraduationCap, Book, Users, Palette, Trees, Lock, ChevronUp, ChevronDown, Smile } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useServer } from '../../context/ServerContext';
import { useAuth } from '../../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { getImageUrl } from '../../utils/imageUtils';
import config from '../../config';
import AnalyticsDashboard from './AnalyticsDashboard';
import './ServerInteractions.css';
import './AnalyticsDashboard.css';

// --- Emoji/Symbol Picker Component ---
const EmojiSymbolPicker = ({ onSelect, onClose }) => {
    const symbols = ['✧', '✦', '⭐', '✨', '⚡', '🔥', '💎', '🎨', '🎮', '🎧', '🎬', '📡', '📢', '🛡️', '⚔️', '⛩️', '🎡', '🚀', '🛸', '🌌', '⚡', '💧', '🍃', '🔥', '❄️', '📍', '💬', '📢', '🔗', '📂', '📜', '⚖️', '🗝️', '⚙️', '🛠️', '🔑', '🔓', '🔒', '🔔', '📣', '💡', '🔦', '🔎', '🕯️', '📌', '📎', '✏️', '🖋️', '📖', '📁', '🗑️', '✅', '❌', '⚠️', '🚫', '🏁', '🏳️', '🏴', '🏴‍☠️', '🌈', '🌊', '🌙', '☀️', '☁️', '⚡', '❄️'];

    return (
        <div className="emoji-picker-mini glass-card" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1100, padding: '10px', width: '200px', marginTop: '5px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                {symbols.map(s => (
                    <button
                        key={s}
                        onClick={() => onSelect(s)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', borderRadius: '4px' }}
                        className="hover-opacity"
                    >
                        {s}
                    </button>
                ))}
            </div>
            <button onClick={onClose} style={{ width: '100%', marginTop: '8px', padding: '4px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Close</button>
        </div>
    );
};

// --- Generic Modal Wrapper ---
const ModalWrapper = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="search-modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
            <div className="search-modal modal-wrapper-dimensions" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease', borderRadius: '16px' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{title}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div style={{ padding: '20px', height: 'calc(100% - 70px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Reusable Confirmation Modal ---
export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmColor = '#ef4444' }) => {
    if (!isOpen) return null;
    return (
        <div className="server-confirmation-overlay" onClick={onClose}>
            <div className="server-confirmation-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body">
                    <p style={{ color: '#9ca3af', marginBottom: '20px' }}>{message}</p>
                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button
                            className="create-btn"
                            style={{ backgroundColor: confirmColor }}
                            onClick={() => { onConfirm(); onClose(); }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Invite People Modal ---
export const InviteModal = ({ isOpen, onClose, serverName }) => {
    const { showToast } = useToast();
    const { user: currentUser } = useAuth();
    const { servers } = useServer();
    const [inviteLink, setInviteLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [expiresIn, setExpiresIn] = useState('7d');
    const [maxUses, setMaxUses] = useState(0); // 0 = unlimited

    const serverData = servers.find(s => s.name === serverName);

    const generateInvite = async () => {
        if (!serverData) return;
        setLoading(true);
        try {
            // Map duration to date
            let expiresAt = null;
            if (expiresIn !== 'never') {
                const now = new Date();
                if (expiresIn === '30m') now.setMinutes(now.getMinutes() + 30);
                else if (expiresIn === '1h') now.setHours(now.getHours() + 1);
                else if (expiresIn === '6h') now.setHours(now.getHours() + 6);
                else if (expiresIn === '12h') now.setHours(now.getHours() + 12);
                else if (expiresIn === '1d') now.setDate(now.getDate() + 1);
                else if (expiresIn === '7d') now.setDate(now.getDate() + 7);
                expiresAt = now.toISOString();
            }

            const res = await fetch(`${config.API_URL}/api/servers/${serverData.id}/invites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: currentUser?.id || currentUser?._id,
                    expiresAt,
                    maxUses: maxUses || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                setInviteLink(`${window.location.origin}/invite/${data.code}`);
            } else {
                showToast('Failed to generate invite link', 'error');
            }
        } catch (e) {
            showToast('Connection error', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && serverData) {
            generateInvite();
        }
    }, [isOpen, expiresIn, maxUses]);

    const handleCopy = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        showToast('Invite link copied to clipboard!', 'success');
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Invite friends to ${serverName}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Share this link with others to grant them access to this server.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <input
                                type="text"
                                readOnly
                                value={loading ? 'Generating...' : inviteLink}
                                style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '0 8px', fontSize: '0.9rem', outline: 'none' }}
                            />
                            <button onClick={handleCopy} className="primary-btn" style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem' }} disabled={loading}>
                                Copy
                            </button>
                        </div>
                    </div>
                </div>

                <div className="invite-settings glass-card" style={{ padding: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Expire After</label>
                            <select
                                value={expiresIn}
                                onChange={(e) => setExpiresIn(e.target.value)}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                            >
                                <option value="30m">30 Minutes</option>
                                <option value="1h">1 Hour</option>
                                <option value="6h">6 Hours</option>
                                <option value="12h">12 Hours</option>
                                <option value="1d">1 Day</option>
                                <option value="7d">7 Days</option>
                                <option value="never">Never</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Max Uses</label>
                            <select
                                value={maxUses}
                                onChange={(e) => setMaxUses(parseInt(e.target.value))}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                            >
                                <option value={0}>Unlimited</option>
                                <option value={1}>1 Use</option>
                                <option value={5}>5 Uses</option>
                                <option value={10}>10 Uses</option>
                                <option value={25}>25 Uses</option>
                                <option value={50}>50 Uses</option>
                                <option value={100}>100 Uses</option>
                            </select>
                        </div>
                    </div>
                </div>

                {inviteLink && !loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <div style={{ background: 'white', padding: '10px', borderRadius: '12px' }}>
                            <QRCodeCanvas value={inviteLink} size={150} level="M" />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan QR code to join</span>
                    </div>
                )}
            </div>
        </ModalWrapper>
    );
};

// --- Create Channel Modal ---
export const CreateChannelModal = ({ isOpen, onClose, onCreate }) => {
    const [channelName, setChannelName] = useState('');
    const [type, setType] = useState('text');

    const handleSubmit = () => {
        if (!channelName.trim()) {
            console.warn('CreateChannelModal: Channel name is empty');
            return;
        }
        try {
            onCreate({ name: channelName.toLowerCase().replace(/\s/g, '-'), type });
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
                    <div
                        onClick={() => setType('stage')}
                        style={{ padding: '12px', borderRadius: '8px', background: type === 'stage' ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                        <Radio size={24} color="#ff4b4b" />
                        <div>
                            <div style={{ fontWeight: 600 }}>Live Stage</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Host interactive sessions with real-time vibe reactions.</div>
                        </div>
                        {type === 'stage' && <div style={{ marginLeft: 'auto', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '10px', height: '10px', background: 'var(--color-primary)', borderRadius: '50%' }} /></div>}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>CHANNEL NAME</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Hash size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        value={channelName}
                        onChange={e => setChannelName(e.target.value)}
                        placeholder="new-channel"
                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '12px', fontSize: '1rem', fontWeight: 500, outline: 'none' }}
                    />
                    {/* Debug indicator */}
                    {channelName && <Check size={18} color="#10b981" style={{ marginRight: '4px' }} />}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={onClose} className="secondary-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>Cancel</button>
                <button onClick={handleSubmit} className="primary-btn" style={{ padding: '10px 24px', borderRadius: '8px' }}>Create Channel</button>
            </div>
        </ModalWrapper>
    );
};

// --- Create Server Modal (Multi-step with Templates) ---
export const CreateServerModal = ({ isOpen, onClose, onCreate }) => {
    const [step, setStep] = useState(1); // 1: Template, 2: Setup
    const [serverName, setServerName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [serverIcon, setServerIcon] = useState(null);

    const templates = [
        { id: 'custom', name: 'Create My Own', channels: ['general'], icon: <Shield size={24} color="#5865F2" /> },
        { id: 'gaming', name: 'Gaming', channels: ['lounge', 'clips', 'patch-notes', 'voice-lounge'], icon: <Gamepad2 size={24} color="#5865F2" /> },
        { id: 'school', name: 'School Club', channels: ['announcements', 'resources', 'homework-help'], icon: <GraduationCap size={24} color="#5865F2" /> },
        { id: 'study', name: 'Study Group', channels: ['focus-room', 'notes', 'questions'], icon: <Book size={24} color="#5865F2" /> },
        { id: 'friends', name: 'Friends', channels: ['hangout', 'memes', 'pics', 'voice-chat'], icon: <Users size={24} color="#5865F2" /> },
        { id: 'artists', name: 'Artists & Creators', channels: ['showcase', 'collabs', 'feedback'], icon: <Palette size={24} color="#5865F2" /> },
        { id: 'community', name: 'Local Community', channels: ['news', 'events', 'marketplace'], icon: <Trees size={24} color="#5865F2" /> }
    ];

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setStep(2);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setServerIcon(url);
        }
    };

    const handleSubmit = () => {
        if (!serverName.trim()) return;
        onCreate({
            name: serverName,
            icon: serverIcon || selectedTemplate?.icon,
            channels: selectedTemplate?.channels || ['general']
        });
        reset();
    };

    const reset = () => {
        setStep(1);
        setServerName('');
        setSelectedTemplate(null);
        setServerIcon(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="search-modal-overlay animate-slide-up" onClick={reset} style={{ zIndex: 10000, alignItems: 'center', paddingTop: 0 }}>
            <div className="search-modal premium-creation-modal" onClick={e => e.stopPropagation()} style={{ width: '440px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px', textAlign: 'center', position: 'relative' }}>
                    {step === 2 && (
                        <button onClick={() => setStep(1)} className="icon-btn" style={{ position: 'absolute', left: '20px', top: '24px' }}><ArrowLeft size={20} /></button>
                    )}
                    <button onClick={reset} className="icon-btn" style={{ position: 'absolute', right: '20px', top: '24px' }}><X size={20} /></button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px' }}>
                        {step === 1 ? 'Create Your Server' : 'Customize Your Server'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                        {step === 1
                            ? "Your server is where your community can grow and stay connected. It's the heart of Stride."
                            : "Give your new server a personality with a name and an icon. You can always change it later."}
                    </p>
                </div>

                <div className="premium-scrollbar" style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
                    {step === 1 ? (
                        <>
                            <div className="template-card own-template" onClick={() => handleTemplateSelect(templates[0])} style={{ padding: '16px' }}>
                                <div className="template-icon" style={{ background: 'rgba(88, 101, 242, 0.15)' }}>{templates[0].icon}</div>
                                <span className="template-name">Create My Own</span>
                                <Plus size={20} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                            </div>

                            <div style={{ margin: '24px 0 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Start from a template
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {templates.slice(1).map(t => (
                                    <div key={t.id} className="template-card" onClick={() => handleTemplateSelect(t)}>
                                        <div className="template-icon">{t.icon}</div>
                                        <span className="template-name">{t.name}</span>
                                        <Plus size={20} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div
                                    onClick={() => document.getElementById('new-server-icon').click()}
                                    style={{
                                        width: '100px', height: '100px', borderRadius: '50%',
                                        background: serverIcon ? `url(${serverIcon}) center/cover` : 'rgba(255,255,255,0.05)',
                                        border: '2px dashed rgba(255,255,255,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', fontSize: '1.5rem', position: 'relative'
                                    }}
                                >
                                    {!serverIcon && <Plus size={32} style={{ opacity: 0.5 }} />}
                                    <input id="new-server-icon" type="file" hidden onChange={handleFileChange} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px' }}>SERVER NAME</label>
                                <input
                                    type="text"
                                    value={serverName}
                                    onChange={e => setServerName(e.target.value)}
                                    placeholder={`${selectedTemplate?.name} Server`}
                                    autoFocus
                                    className="premium-input-large"
                                />
                            </div>

                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                                By creating a server, you agree to Content Guidelines.
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ padding: '16px 24px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {step === 1 ? (
                        <>
                            <div style={{ textAlign: 'left' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>Have an invite already?</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter an invite link to join.</p>
                            </div>
                            <button
                                onClick={() => {
                                    const code = prompt("Enter an invite code or link:");
                                    if (code) showToast(`Joining server: ${code}`, 'success');
                                }}
                                className="primary-btn"
                                style={{ padding: '10px 24px', borderRadius: '4px' }}
                            >
                                Join a Server
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>Back</button>
                            <button
                                onClick={handleSubmit}
                                disabled={!serverName.trim()}
                                className="primary-btn"
                                style={{ padding: '10px 32px', borderRadius: '4px', opacity: serverName.trim() ? 1 : 0.5 }}
                            >
                                Create
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Add Member to Role Modal ---
export const AddMemberModal = ({ isOpen, onClose, members, onAdd, roleName }) => {
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

    const filteredMembers = members.filter(m =>
        (m.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (m.username?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (m.nickname?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (m.email?.toLowerCase() || '').includes(search.toLowerCase())
    );

    return (
        <div className="search-modal-overlay" onClick={onClose} style={{ zIndex: 11000 }}>
            <div className="search-modal" onClick={e => e.stopPropagation()} style={{ width: '440px', maxWidth: '95vw', animation: 'scaleIn 0.2s ease' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Add to {roleName}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '12px', fontSize: '0.95rem', outline: 'none' }}
                            autoFocus
                        />
                    </div>

                    <div className="premium-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map(member => (
                                <div
                                    key={member.id}
                                    onClick={() => onAdd(member)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '8px',
                                        borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div
                                        style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: `url(${getImageUrl(member.avatar, 'user')}) center/cover`
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{member.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email}</div>
                                    </div>
                                    <Plus size={16} color="var(--text-muted)" />
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px' }}>
                                No members found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Server Settings Modal ---
export const ServerSettingsModal = ({ isOpen, onClose, server, onDelete, onUpdate, hasPermission }) => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [editingRole, setEditingRole] = useState(null);
    const [verificationLevel, setVerificationLevel] = useState('None');
    const [explicitContentFilter, setExplicitContentFilter] = useState('Scan members');
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [serverMembers, setServerMembers] = useState([]);
    const { fetchMembers, fetchRoles, createRole, updateRole, deleteRole, assignRole, deleteChannel, updateServer } = useServer();
    const { showToast } = useToast();
    const [serverName, setServerName] = useState(server?.name || '');
    const [serverIcon, setServerIcon] = useState(null);
    const [serverChannels, setServerChannels] = useState(server?.channels || []);
    const [serverCategories, setServerCategories] = useState(server?.categories || []);
    const [readOnlyChannels, setReadOnlyChannels] = useState(server?.readOnlyChannels || []);
    const [isPublic, setIsPublic] = useState(server?.isPublic || false);
    const [serverDescription, setServerDescription] = useState(server?.description || '');
    const [serverCategory, setServerCategory] = useState(server?.category || 'Social');
    const [serverTags, setServerTags] = useState(server?.tags?.join(', ') || '');
    const [blacklistedKeywords, setBlacklistedKeywords] = useState(server?.blacklistedKeywords?.join(', ') || '');
    const [subscriptionTiers, setSubscriptionTiers] = useState(server?.subscriptionTiers || []);
    const [showEmojiFor, setShowEmojiFor] = useState(null); // { type: 'channel' | 'category', index: number }

    const [roles, setRoles] = useState([]);
    const [newRoleName, setNewRoleName] = useState('');

    // Confirmation Modal State
    const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, type: null, data: null });

    const [revenueData, setRevenueData] = useState(null);
    const [loadingRevenue, setLoadingRevenue] = useState(false);
    const [subscribers, setSubscribers] = useState([]);

    useEffect(() => {
        if (isOpen && server?.id !== undefined) {
            fetchMembers(server.id).then(data => {
                const members = data || [];
                setServerMembers(members);
                // Extract subscribers for the monetization tab
                setSubscribers(members.filter(m => m.subscription));
            });
            fetchRoles(server.id).then(data => setRoles(Array.isArray(data) ? data : []));
        }
    }, [isOpen, server?.id, fetchMembers, fetchRoles]);

    useEffect(() => {
        if (activeTab === 'Monetization' && server?.id !== undefined) {
            setLoadingRevenue(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            fetch(`${config.API_URL}/api/servers/${server.id}/revenue`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    setRevenueData(data);
                    setLoadingRevenue(false);
                })
                .catch(err => {
                    console.error("Revenue fetch failed", err);
                    setLoadingRevenue(false);
                });
        }
    }, [activeTab, server?.id]);

    const handleAddMemberToRole = async (member) => {
        if (!editingRole) return;
        const success = await assignRole(server.id, member.userId || member.email, editingRole._id);
        if (success) {
            const updatedRoles = await fetchRoles(server.id);
            setRoles(updatedRoles);
            const updatedEditingRole = updatedRoles.find(r => r._id === editingRole._id);
            setEditingRole(updatedEditingRole);
            showToast(`Added ${member.name || member.username} to ${editingRole.name}`, 'success');
        }
        setIsAddingMember(false);
    };

    // Update local state when server prop changes
    useEffect(() => {
        if (server) {
            setServerName(server.name || '');
            setServerIcon(server.icon || null);
            setServerChannels(server.channels || []);
            setServerCategories(server.categories || []);
            setReadOnlyChannels(server.readOnlyChannels || []);
            setIsPublic(server.isPublic || false);
            setServerDescription(server.description || '');
            setServerCategory(server.category || 'Social');
            setServerTags(server.tags?.join(', ') || '');
            setBlacklistedKeywords(server.blacklistedKeywords?.join(', ') || '');
            setVerificationLevel(server.verificationLevel || 'None');
            setExplicitContentFilter(server.explicitContentFilter || 'Scan members');
            setSubscriptionTiers(server.subscriptionTiers || []);
        }
    }, [server, isOpen]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setServerIcon(url);
        }
    };

    const handleSave = () => {
        if (onUpdate) {
            onUpdate({
                name: serverName,
                icon: serverIcon,
                channels: serverChannels,
                categories: serverCategories,
                readOnlyChannels: readOnlyChannels,
                isPublic: isPublic,
                description: serverDescription,
                category: serverCategory,
                tags: serverTags.split(',').map(t => t.trim()).filter(Boolean),
                blacklistedKeywords: blacklistedKeywords.split(',').map(k => k.trim()).filter(Boolean),
                verificationLevel: verificationLevel,
                explicitContentFilter: explicitContentFilter,
                subscriptionTiers: subscriptionTiers
            });
            onClose();
        }
    };

    const handleClearHistory = (channelId) => {
        confirmClearHistory(channelId);
    };

    const confirmClearHistory = async (channelId) => {
        try {
            const res = await fetch(`${config.API_URL}/api/servers/${server?.id}/channels/${channelId}/messages`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showToast(`History cleared for #${channelId}`, 'success');
            }
        } catch (e) {
            showToast("Failed to clear history", 'error');
        }
    };

    const handleDeleteChannelClick = (channelId) => {
        confirmDeleteChannel(channelId);
    };

    const confirmDeleteChannel = async (channelId) => {
        const success = await deleteChannel(server?.id, channelId);
        if (success) {
            showToast(`Deleted #${channelId}`, 'success');
            // Update all local states immediately
            setServerChannels(prev => prev.filter(c => c !== channelId));
            setServerCategories(prev => prev.map(cat => ({
                ...cat,
                channels: cat.channels.filter(c => c !== channelId)
            })));
            setReadOnlyChannels(prev => prev.filter(c => c !== channelId));
        } else {
            showToast("Failed to delete channel", 'error');
        }
    };

    const handleAddRole = async () => {
        if (newRoleName.trim()) {
            const roleName = newRoleName.trim();
            const newRole = await createRole(server.id, {
                name: roleName,
                color: '#9ca3af',
                permissions: {
                    administrator: false,
                    manageServer: false,
                    manageChannels: false,
                    manageMessages: false,
                    manageMembers: false,
                    createInvite: true,
                    changeNickname: true,
                    manageNicknames: false,
                    sendMessages: true,
                    readHistory: true
                }
            });
            if (newRole) {
                setRoles([...roles, newRole]);
                setNewRoleName('');
                showToast(`Role '${roleName}' created`, 'success');
            }
        }
    };

    const handleDeleteRole = async (id) => {
        const success = await deleteRole(id);
        if (success) {
            setRoles(roles.filter(r => (r._id || r.id) !== id));
            showToast("Role deleted", 'success');
        }
    };

    const handleUpdateRole = async (roleId, updates) => {
        const updated = await updateRole(roleId, updates);
        if (updated) {
            setRoles(roles.map(r => r._id === roleId ? updated : r));
            setEditingRole(updated);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title="Server Settings">
            <div className="server-settings-container" style={{ display: 'flex', height: '100%', minHeight: '520px' }}>
                <div className="settings-sidebar" style={{ width: '220px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '10px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '0 12px 12px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{server?.name || 'Server'} Settings</div>
                    {['Overview', 'Discovery', 'Insights', 'Channels', 'Categories', 'Roles', 'Moderation', 'Monetization', 'Members Management'].map(tab => (
                        <div
                            key={tab}
                            onClick={() => { setActiveTab(tab); setEditingRole(null); }}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                                background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                                marginBottom: '4px',
                                fontSize: '0.9rem'
                            }}
                        >
                            {tab}
                        </div>
                    ))}
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />
                    <div
                        style={{ padding: '8px 12px', color: '#ef4444', cursor: 'pointer', background: activeTab === 'Delete' ? 'rgba(239,68,68,0.1)' : 'transparent', borderRadius: '4px', fontSize: '0.9rem' }}
                        onClick={() => { if (onDelete) onDelete(); }}
                    >
                        Delete Server
                    </div>
                </div>

                <div className="settings-content" style={{ flex: 1, paddingLeft: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <h4 className="settings-tab-title" style={{ marginTop: 0, marginBottom: '20px' }}>{activeTab}</h4>
                    <div className="premium-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                        {activeTab === 'Delete' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                                <h4 style={{ color: 'white', marginBottom: '1rem' }}>Delete {serverName}</h4>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                    Are you sure you want to delete <strong>{serverName}</strong>? This action cannot be undone.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={() => setActiveTab('Overview')} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={() => { if (onDelete) onDelete(); }} style={{ padding: '10px 20px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Delete Server</button>
                                </div>
                            </div>
                        ) : activeTab === 'Overview' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '10px' }}>
                                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                                        <div
                                            onClick={() => document.getElementById('server-icon-upload').click()}
                                            style={{
                                                width: '120px',
                                                height: '120px',
                                                borderRadius: '50%',
                                                background: serverIcon ? (serverIcon.startsWith('blob:') || serverIcon.startsWith('http') ? `url(${serverIcon}) center/cover` : 'var(--color-surface)') : 'var(--color-surface)',
                                                border: '3px solid rgba(255,255,255,0.1)',
                                                boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                flexShrink: 0
                                            }}>
                                            {!serverIcon && <Palette size={40} color="var(--text-secondary)" />}
                                            <div className="hover-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>EDIT</span>
                                            </div>
                                            <input id="server-icon-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                            <button
                                                onClick={() => document.getElementById('server-icon-upload').click()}
                                                className="secondary-btn"
                                                style={{ fontSize: '0.75rem', padding: '8px 15px', borderRadius: '8px' }}
                                            >
                                                Change Icon
                                            </button>
                                            {serverIcon && (
                                                <button
                                                    onClick={() => setServerIcon(null)}
                                                    style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    Remove Icon
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>SERVER NAME</label>
                                            <input
                                                type="text"
                                                value={serverName}
                                                onChange={(e) => setServerName(e.target.value)}
                                                className="premium-input"
                                                style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', fontSize: '1rem', fontWeight: 600, outline: 'none' }}
                                            />
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                            Customize your server's identity. This name and icon will be visible to all members and in the Explore section.
                                        </p>
                                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={handleSave}
                                                className="primary-btn"
                                                style={{ padding: '10px 24px', borderRadius: '4px', fontWeight: 600 }}
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'Insights' ? (
                            <AnalyticsDashboard serverId={server?.id} />
                        ) : activeTab === 'Monetization' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px' }}>
                                <div style={{ background: 'var(--color-primary-soft)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-primary-faint)' }}>
                                    <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Vibe Prime Creator Economy</h4>
                                    <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                                        Reward your community with exclusive tiers. Members subscribe using Vibe Tokens, and 100% of the tokens go directly to your balance.
                                    </p>
                                </div>

                                {/* Revenue Summary Dashboard */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Revenue</label>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                                            <div style={{ width: '20px', height: '20px', background: 'var(--color-primary)', borderRadius: '50%', color: 'black', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>V</div>
                                            {revenueData?.summary?.totalRevenue || 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Subscribers</label>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginTop: '5px' }}>
                                            {subscribers.length}
                                        </div>
                                    </div>
                                </div>

                                {/* Simple Revenue Chart */}
                                {revenueData?.dailyData?.length > 0 && (
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '15px', display: 'block' }}>Revenue (Last 7 Days)</label>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px', paddingBottom: '20px' }}>
                                            {revenueData.dailyData.map((day, idx) => (
                                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            height: `${(day.revenue / (revenueData.summary.totalRevenue || 1)) * 100}%`,
                                                            minHeight: '2px',
                                                            background: 'var(--color-primary)',
                                                            borderRadius: '4px 4px 0 0',
                                                            opacity: 0.6 + (idx * 0.05)
                                                        }}
                                                        title={`${day._id}: ${day.revenue} tokens`}
                                                    />
                                                    <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{day._id.split('-').slice(1).join('/')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Subscribers List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Subscribers</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                                        {subscribers.length === 0 ? (
                                            <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active subscribers yet.</p>
                                            </div>
                                        ) : (
                                            subscribers.map((sub, idx) => (
                                                <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <img src={sub.avatar || 'https://via.placeholder.com/32'} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{sub.nickname}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>{sub.subscription.tierName}</div>
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        Expires: {new Date(sub.subscription.expiresAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tier Configuration</label>

                                    {subscriptionTiers.length === 0 && (
                                        <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>No subscription tiers created yet.</p>
                                        </div>
                                    )}

                                    {subscriptionTiers.map((tier, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 120px', gap: '15px', marginBottom: '15px' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LEVEL</label>
                                                    <input
                                                        type="number"
                                                        value={tier.level || 1}
                                                        onChange={(e) => {
                                                            const newTiers = [...subscriptionTiers];
                                                            newTiers[idx].level = parseInt(e.target.value) || 1;
                                                            setSubscriptionTiers(newTiers);
                                                        }}
                                                        className="premium-input-small"
                                                        style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TIER NAME</label>
                                                    <input
                                                        type="text"
                                                        value={tier.name}
                                                        onChange={(e) => {
                                                            const newTiers = [...subscriptionTiers];
                                                            newTiers[idx].name = e.target.value;
                                                            setSubscriptionTiers(newTiers);
                                                        }}
                                                        className="premium-input-small"
                                                        style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOKEN COST</label>
                                                    <input
                                                        type="number"
                                                        value={tier.cost}
                                                        onChange={(e) => {
                                                            const newTiers = [...subscriptionTiers];
                                                            newTiers[idx].cost = parseInt(e.target.value) || 0;
                                                            setSubscriptionTiers(newTiers);
                                                        }}
                                                        className="premium-input-small"
                                                        style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PERKS (COMMA SEPARATED)</label>
                                                <input
                                                    type="text"
                                                    value={tier.perks?.join(', ') || ''}
                                                    onChange={(e) => {
                                                        const newTiers = [...subscriptionTiers];
                                                        newTiers[idx].perks = e.target.value.split(',').map(p => p.trim());
                                                        setSubscriptionTiers(newTiers);
                                                    }}
                                                    placeholder="E.g. VIP Role, Private Channels..."
                                                    className="premium-input-small"
                                                    style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                                                />
                                            </div>

                                            <button
                                                onClick={() => setSubscriptionTiers(subscriptionTiers.filter((_, i) => i !== idx))}
                                                style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => setSubscriptionTiers([...subscriptionTiers, { level: subscriptionTiers.length + 1, name: 'Bronze Vibe', cost: 100, perks: ['Exclusive Role'], badgeColor: '#cd7f32' }])}
                                        className="outline-btn"
                                        style={{ width: '100%', padding: '12px', border: '1px dashed var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}
                                    >
                                        <Plus size={18} /> Create New Tier
                                    </button>
                                </div>

                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                    <button onClick={handleSave} className="primary-btn" style={{ padding: '10px 24px', borderRadius: '8px' }}>Save Monetization</button>
                                </div>
                            </div>
                        ) : activeTab === 'Discovery' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Public Discovery</h4>
                                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Allow anyone to find and join this server in the Communities explore section.</p>
                                        </div>
                                        <div
                                            onClick={() => setIsPublic(!isPublic)}
                                            style={{
                                                width: '50px', height: '26px', borderRadius: '13px',
                                                background: isPublic ? 'var(--vibe-accent)' : 'rgba(255,255,255,0.1)',
                                                position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                                                position: 'absolute', top: '3px', left: isPublic ? '27px' : '3px',
                                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                            }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', opacity: isPublic ? 1 : 0.5, pointerEvents: isPublic ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                                        <div>
                                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>SERVER DESCRIPTION</label>
                                            <textarea
                                                value={serverDescription}
                                                onChange={(e) => setServerDescription(e.target.value)}
                                                placeholder="Tell potential members what your community is all about..."
                                                maxLength={200}
                                                style={{ width: '100%', height: '80px', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', resize: 'none' }}
                                            />
                                            <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{serverDescription.length}/200</div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>CATEGORY</label>
                                                <select
                                                    value={serverCategory}
                                                    onChange={(e) => setServerCategory(e.target.value)}
                                                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                                                >
                                                    {['Gaming', 'Music', 'Tech', 'Entertainment', 'Social', 'Other'].map(cat => (
                                                        <option key={cat} value={cat} style={{ background: '#1a1a24' }}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>TAGS (COMMA SEPARATED)</label>
                                                <input
                                                    type="text"
                                                    value={serverTags}
                                                    onChange={(e) => setServerTags(e.target.value)}
                                                    placeholder="gaming, chill, music..."
                                                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={handleSave}
                                            className="primary-btn"
                                            style={{ padding: '10px 24px', borderRadius: '4px', fontWeight: 600 }}
                                        >
                                            Save Discovery Settings
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'Channels' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                    Manage the order of channels in your server.
                                </div>
                                <div className="premium-scrollbar" style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {serverChannels.map((channel, index) => (
                                        <div key={`channel-${channel}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                            <Hash size={16} color="var(--text-muted)" />
                                            <input
                                                type="text"
                                                value={channel}
                                                onChange={(e) => {
                                                    const newChannels = [...serverChannels];
                                                    const oldName = newChannels[index];
                                                    const newName = e.target.value.toLowerCase().replace(/\s/g, '-');
                                                    newChannels[index] = newName;
                                                    setServerChannels(newChannels);

                                                    // Sync readOnlyChannels if names match
                                                    if (readOnlyChannels.includes(oldName)) {
                                                        setReadOnlyChannels(readOnlyChannels.map(c => c === oldName ? newName : c));
                                                    }
                                                }}
                                                style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '0.9rem', fontWeight: 500, outline: 'none' }}
                                            />
                                            <button
                                                className="icon-btn"
                                                onClick={() => {
                                                    const isReadOnly = readOnlyChannels.includes(channel);
                                                    if (isReadOnly) {
                                                        setReadOnlyChannels(readOnlyChannels.filter(c => c !== channel));
                                                    } else {
                                                        setReadOnlyChannels([...readOnlyChannels, channel]);
                                                    }
                                                }}
                                                title={readOnlyChannels.includes(channel) ? "Read-Only Enabled" : "Read-Only Disabled"}
                                                style={{ color: readOnlyChannels.includes(channel) ? '#f59e0b' : 'var(--text-muted)' }}
                                            >
                                                {readOnlyChannels.includes(channel) ? <Lock size={16} /> : <Smile size={16} />}
                                            </button>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    onClick={() => {
                                                        if (index === 0) return;
                                                        const newChannels = [...serverChannels];
                                                        [newChannels[index - 1], newChannels[index]] = [newChannels[index], newChannels[index - 1]];
                                                        setServerChannels(newChannels);
                                                    }}
                                                    className="icon-btn"
                                                    style={{ opacity: index === 0 ? 0.3 : 1, padding: '4px' }}
                                                    disabled={index === 0}
                                                >
                                                    <ChevronUp size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (index === serverChannels.length - 1) return;
                                                        const newChannels = [...serverChannels];
                                                        [newChannels[index + 1], newChannels[index]] = [newChannels[index], newChannels[index + 1]];
                                                        setServerChannels(newChannels);
                                                    }}
                                                    className="icon-btn"
                                                    style={{ opacity: index === serverChannels.length - 1 ? 0.3 : 1, padding: '4px' }}
                                                    disabled={index === serverChannels.length - 1}
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteChannel(channel)}
                                                    className="icon-btn"
                                                    title="Delete Channel"
                                                    style={{ color: '#ef4444' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleClearHistory(channel)}
                                                    className="icon-btn"
                                                    title="Clear Channel History"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    <Plus size={16} style={{ transform: 'rotate(45deg)' }} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : activeTab === 'Categories' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                    Manage and reorder your server categories.
                                </div>
                                <div className="premium-scrollbar" style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {serverCategories.map((category, index) => (
                                        <div key={`category-${category.name}-${index}`} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <ChevronDown size={14} color="var(--text-muted)" />
                                                <input
                                                    type="text"
                                                    value={category.name}
                                                    onChange={(e) => {
                                                        const newCats = [...serverCategories];
                                                        newCats[index].name = e.target.value.toUpperCase();
                                                        setServerCategories(newCats);
                                                    }}
                                                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em', outline: 'none' }}
                                                />
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        onClick={() => {
                                                            if (index === 0) return;
                                                            const newCats = [...serverCategories];
                                                            [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
                                                            setServerCategories(newCats);
                                                        }}
                                                        className="icon-btn"
                                                        style={{ opacity: index === 0 ? 0.3 : 1 }}
                                                        disabled={index === 0}
                                                    >
                                                        <ChevronUp size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (index === serverCategories.length - 1) return;
                                                            const newCats = [...serverCategories];
                                                            [newCats[index + 1], newCats[index]] = [newCats[index], newCats[index + 1]];
                                                            setServerCategories(newCats);
                                                        }}
                                                        className="icon-btn"
                                                        style={{ opacity: index === serverCategories.length - 1 ? 0.3 : 1 }}
                                                        disabled={index === serverCategories.length - 1}
                                                    >
                                                        <ChevronDown size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`Delete category ${category.name}?`)) {
                                                                setServerCategories(serverCategories.filter((_, i) => i !== index));
                                                            }
                                                        }}
                                                        className="icon-btn"
                                                        style={{ color: '#ef4444' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '26px' }}>
                                                {category.channels.length} channels
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setServerCategories([...serverCategories, { name: 'NEW CATEGORY', channels: [] }])}
                                    className="secondary-btn"
                                    style={{ marginTop: '10px', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}
                                >
                                    <Plus size={16} style={{ marginRight: '8px' }} /> Add Category
                                </button>
                            </div>
                        ) : activeTab === 'Members Management' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Search size={14} color="var(--text-muted)" />
                                    <input type="text" placeholder="Search members..." style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '8px', fontSize: '0.85rem' }} />
                                </div>
                                <div className="premium-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {serverMembers.map(member => (
                                        <div key={member.id} className="member-item-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '6px', marginBottom: '4px' }}>
                                            <img src={member.avatar || `https://i.pravatar.cc/100?u=${member.id}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{member.name || member.username}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{member.username}</div>
                                            </div>
                                            {hasPermission('manageMembers') && (
                                                <button onClick={() => { if (window.confirm(`Ban ${member.name}?`)) showToast(`Banned ${member.name}`, 'success'); }} className="icon-btn" style={{ color: '#ef4444' }} title="Ban Member"><Shield size={16} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : activeTab === 'Moderation' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <section>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Verification Level</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {['None', 'Low (Verified Email)', 'Medium (Registered > 5m)', 'High (Member > 10m)'].map(level => (
                                            <div key={level} onClick={() => setVerificationLevel(level)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: verificationLevel === level ? '1px solid var(--color-primary)' : '1px solid transparent', cursor: 'pointer' }}>
                                                <span style={{ fontSize: '0.9rem', color: verificationLevel === level ? 'white' : 'var(--text-secondary)' }}>{level}</span>
                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--text-muted)', background: verificationLevel === level ? 'var(--color-primary)' : 'transparent' }} />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                                <section>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Explicit Content Filter</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {['Don\'t scan', 'Scan members', 'Scan everyone'].map(filter => (
                                            <div key={filter} onClick={() => setExplicitContentFilter(filter)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: explicitContentFilter === filter ? '1px solid var(--color-primary)' : '1px solid transparent', cursor: 'pointer' }}>
                                                <span style={{ fontSize: '0.9rem', color: explicitContentFilter === filter ? 'white' : 'var(--text-secondary)' }}>{filter}</span>
                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--text-muted)', background: explicitContentFilter === filter ? 'var(--color-primary)' : 'transparent' }} />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                                <section>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Keyword Blacklist</div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Messages containing these words will be blocked automatically. Comma-separated.</p>
                                    <textarea
                                        value={blacklistedKeywords}
                                        onChange={(e) => setBlacklistedKeywords(e.target.value)}
                                        placeholder="badword1, badword2..."
                                        className="premium-input"
                                        style={{ width: '100%', minHeight: '80px', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                    />
                                </section>
                            </div>
                        ) : activeTab === 'Roles' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {editingRole ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                            <button onClick={() => setEditingRole(null)} className="icon-btn" style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={20} /></button>
                                            <h4 style={{ margin: 0 }}>Edit Role — {editingRole.name}</h4>
                                        </div>
                                        <div className="premium-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <section>
                                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700 }}>ROLE NAME</label>
                                                <input type="text" value={editingRole.name} onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })} onBlur={() => handleUpdateRole(editingRole._id, { name: editingRole.name })} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }} />
                                            </section>
                                            <section>
                                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700 }}>ROLE COLOR</label>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <input
                                                        type="color"
                                                        value={editingRole.color || '#99aab5'}
                                                        onChange={(e) => {
                                                            const color = e.target.value;
                                                            setEditingRole({ ...editingRole, color });
                                                            handleUpdateRole(editingRole._id, { color });
                                                        }}
                                                        style={{
                                                            width: '60px',
                                                            height: '40px',
                                                            padding: 0,
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            background: 'transparent'
                                                        }}
                                                    />
                                                    <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{editingRole.color || '#99aab5'}</span>
                                                </div>
                                            </section>
                                            <section>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Permissions</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {[
                                                        { id: 'administrator', name: 'Administrator' },
                                                        { id: 'manageServer', name: 'Manage Server' },
                                                        { id: 'manageChannels', name: 'Manage Channels' },
                                                        { id: 'manageMessages', name: 'Manage Messages' },
                                                        { id: 'manageMembers', name: 'Manage Members' },
                                                        { id: 'sendMessages', name: 'Send Messages' },
                                                        { id: 'readHistory', name: 'Read History' }
                                                    ].map(perm => (
                                                        <div key={perm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                                            <span style={{ fontSize: '0.9rem' }}>{perm.name}</span>
                                                            <div onClick={() => { const newPerms = { ...editingRole.permissions, [perm.id]: !editingRole.permissions?.[perm.id] }; handleUpdateRole(editingRole._id, { permissions: newPerms }); }} style={{ width: '40px', height: '20px', borderRadius: '10px', background: editingRole.permissions?.[perm.id] ? 'var(--color-primary)' : '#4E5058', position: 'relative', cursor: 'pointer' }}>
                                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: editingRole.permissions?.[perm.id] ? '22px' : '2px', transition: 'left 0.2s' }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                            <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="New role name..." style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }} />
                                            <button onClick={handleAddRole} disabled={!newRoleName.trim()} className="primary-btn" style={{ padding: '8px 16px', opacity: newRoleName.trim() ? 1 : 0.5 }}>Add</button>
                                        </div>
                                        <div className="premium-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                                            {roles.map(role => (
                                                <div key={role.id || role._id} onClick={() => setEditingRole(role)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px', cursor: 'pointer' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={16} color={role.color} /><span>{role.name}</span></div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id || role._id); }} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {!editingRole && activeTab !== 'Delete' && (
                        <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <button onClick={handleSave} className="primary-btn" style={{ padding: '10px 24px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Changes</button>
                        </div>
                    )}
                </div>
            </div>

            <AddMemberModal
                isOpen={isAddingMember}
                onClose={() => setIsAddingMember(false)}
                members={serverMembers}
                onAdd={handleAddMemberToRole}
                roleName={editingRole?.name}
            />

            <ConfirmationModal
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({ ...confirmModalState, isOpen: false })}
                title={confirmModalState.title}
                message={confirmModalState.message}
                onConfirm={() => {
                    if (confirmModalState.type === 'delete_channel') {
                        confirmDeleteChannel(confirmModalState.data);
                    } else if (confirmModalState.type === 'clear_history') {
                        confirmClearHistory(confirmModalState.data);
                    }
                }}
            />
        </ModalWrapper >
    );
};

// --- Server Profile Modal ---
export const ServerProfileModal = ({ isOpen, onClose, serverName, currentNickname, canEdit, onSave }) => {
    const [nickname, setNickname] = useState(currentNickname || '');

    // Reset nickname when modal opens or prop changes
    useEffect(() => {
        if (isOpen) setNickname(currentNickname || '');
    }, [isOpen, currentNickname]);

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Profile: ${serverName}`}>
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>NICKNAME</label>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0 12px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    opacity: canEdit ? 1 : 0.7
                }}>
                    <User size={16} color="var(--text-muted)" />
                    <input
                        type="text"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        placeholder="No nickname set"
                        disabled={!canEdit}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: canEdit ? 'white' : 'var(--text-muted)', padding: '10px', outline: 'none', cursor: canEdit ? 'text' : 'not-allowed' }}
                    />
                </div>
                {!canEdit && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        You don't have permission to change this nickname.
                    </p>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={onClose} className="secondary-btn" style={{ padding: '8px 16px' }}>
                    {canEdit ? 'Cancel' : 'Close'}
                </button>
                {canEdit && (
                    <button
                        onClick={() => onSave(nickname)}
                        style={{
                            background: 'var(--color-primary)',
                            border: 'none',
                            color: 'white',
                            padding: '8px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Save Changes
                    </button>
                )}
            </div>
        </ModalWrapper>
    );
};

// --- Subscribe to Vibe Prime Modal ---
export const SubscribeModal = ({ isOpen, onClose, server, onSubscribe }) => {
    const { user, updateTokens } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async (tier) => {
        if (!user) return;
        if ((user.vibeTokens || 0) < tier.cost) {
            showToast("Not enough Vibe Tokens!", "error");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${config.API_URL}/api/servers/${server.id}/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tierName: tier.name }) // email handled by backend session
            });

            const data = await res.json();
            if (res.ok) {
                showToast(`Successfully joined ${tier.name}!`, "success");
                updateTokens(data.newBalance);
                if (onSubscribe) onSubscribe(tier);
                onClose();
            } else {
                showToast(data.error || "Subscription failed", "error");
            }
        } catch (err) {
            showToast("Connection error", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!server) return null;

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Join ${server.name} Vibe Prime`}>
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Unlock Exclusive Perks</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
                        Support the creator and get special badges and access!
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {server.subscriptionTiers && server.subscriptionTiers.length > 0 ? (
                        [...server.subscriptionTiers].sort((a, b) => (a.level || 1) - (b.level || 1)).map((tier, idx) => {
                            const currentSubscription = user?.activeSubscriptions?.find(sub => sub.serverId === server.id);
                            const isCurrentTier = currentSubscription?.tierName === tier.name;
                            const isLowerTier = currentSubscription && (currentSubscription.tierLevel || 1) > (tier.level || 1);

                            return (
                                <div key={idx} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${isCurrentTier ? tier.badgeColor : tier.badgeColor + '44'}`, background: isCurrentTier ? `${tier.badgeColor}15` : `${tier.badgeColor}08`, transition: 'all 0.3s ease' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h4 style={{ margin: 0, color: tier.badgeColor, fontSize: '1.1rem' }}>{tier.name}</h4>
                                            {isCurrentTier && <span style={{ fontSize: '0.65rem', background: tier.badgeColor, color: '#fff', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold' }}>CURRENT TIER</span>}
                                        </div>
                                        <ul style={{ margin: '10px 0 0', paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {tier.perks?.map((perk, i) => <li key={i}>{perk}</li>)}
                                        </ul>
                                        <div style={{ marginTop: '12px', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                                            {tier.cost} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Tokens/mo</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '15px' }}>
                                        {isCurrentTier ? (
                                            <button className="primary-btn" style={{ background: 'transparent', border: `1px solid ${tier.badgeColor}`, color: tier.badgeColor, cursor: 'default' }} disabled>Subscribed</button>
                                        ) : isLowerTier ? (
                                            <button className="primary-btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', cursor: 'default' }} disabled>Included in your Tier</button>
                                        ) : (
                                            <button
                                                onClick={() => handleSubscribe(tier)}
                                                disabled={loading}
                                                className="primary-btn"
                                                style={{ background: tier.badgeColor, filter: loading ? 'grayscale(1)' : 'none', boxShadow: `0 4px 12px ${tier.badgeColor}40` }}
                                            >
                                                {loading ? 'Processing...' : (currentSubscription ? 'Upgrade' : 'Subscribe')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            This server hasn't set up Vibe Prime tiers yet. Check back soon!
                        </div>
                    )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Subscriptions renew automatically every 30 days if you have enough tokens.
                </div>
            </div>
        </ModalWrapper>
    );
};

// --- Channel Settings Modal ---
export const ChannelSettingsModal = ({ isOpen, onClose, channelName, isReadOnly = false, onUpdate, onDelete }) => {
    const [newName, setNewName] = useState(channelName);
    const [readOnly, setReadOnly] = useState(isReadOnly);

    useEffect(() => {
        setNewName(channelName);
        setReadOnly(isReadOnly);
    }, [channelName, isReadOnly, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="search-modal-overlay animate-slide-up" onClick={onClose} style={{ zIndex: 12000 }}>
            <div className="search-modal glass-card" onClick={e => e.stopPropagation()} style={{ width: '440px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {readOnly ? <Lock size={20} /> : <Hash size={20} />} Channel Settings
                    </h3>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px' }}>CHANNEL NAME</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="premium-input-large"
                            placeholder="channel-name"
                        />
                    </div>

                    <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>Read-Only Channel</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Only administrators can post in this channel.</div>
                            </div>
                            <div
                                onClick={() => setReadOnly(!readOnly)}
                                style={{
                                    width: '40px', height: '20px', borderRadius: '10px',
                                    background: readOnly ? 'var(--color-primary)' : '#4E5058',
                                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                                    position: 'absolute', top: '2px', left: readOnly ? '22px' : '2px',
                                    transition: 'left 0.2s'
                                }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            onClick={() => onUpdate({ name: newName, isReadOnly: readOnly })}
                            className="primary-btn"
                            style={{ width: '100%', padding: '12px', borderRadius: '6px' }}
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={onDelete}
                            className="menu-item danger"
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', justifyContent: 'center' }}
                        >
                            <Trash2 size={18} style={{ marginRight: '8px' }} /> Delete Channel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
