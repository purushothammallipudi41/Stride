import { useState, useEffect } from 'react';
import { Bot as BotIcon, Plus, Copy, Trash2, X, RefreshCw, Key, Shield } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import config from '../../config';
import './BotDashboard.css';

const BotDashboard = ({ user, onClose }) => {
    const [bots, setBots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newBotName, setNewBotName] = useState('');
    const [newBotUsername, setNewBotUsername] = useState('');
    const [visibleTokenId, setVisibleTokenId] = useState(null);
    const { showToast } = useToast();

    useEffect(() => {
        fetchBots();
    }, []);

    const fetchBots = async () => {
        try {
            const res = await fetch(`${config.API_URL}/api/bots?email=${user.email}`);
            const data = await res.json();
            if (Array.isArray(data)) setBots(data);
        } catch (err) {
            showToast("Failed to load bots", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBot = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${config.API_URL}/api/bots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newBotName,
                    username: newBotUsername,
                    ownerEmail: user.email
                })
            });
            const data = await res.json();
            if (res.ok) {
                setBots([...bots, data]);
                setShowCreateForm(false);
                setNewBotName('');
                setNewBotUsername('');
                showToast("Bot created successfully!", "success");
            } else {
                showToast(data.error || "Failed to create bot", "error");
            }
        } catch (err) {
            showToast("Creation failed", "error");
        }
    };

    const handleDeleteBot = async (botId) => {
        if (!window.confirm("Delete this bot? This will invalidate its token.")) return;
        try {
            const res = await fetch(`${config.API_URL}/api/bots/${botId}?email=${user.email}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setBots(bots.filter(b => b._id !== botId));
                showToast("Bot deleted", "success");
            }
        } catch (err) {
            showToast("Delete failed", "error");
        }
    };

    const copyToken = (token) => {
        navigator.clipboard.writeText(token);
        showToast("Token copied!", "success");
    };

    return (
        <div className="bot-dashboard-overlay glass-panel animate-in">
            <div className="bot-dashboard glass-card">
                <header className="bot-dash-header">
                    <div className="header-title">
                        <BotIcon size={24} color="var(--color-primary)" />
                        <h3>Bot Management</h3>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </header>

                <div className="bot-dash-content premium-scrollbar">
                    {isLoading ? (
                        <div className="flex-center p-xl">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : (
                        <>
                            <div className="bot-list">
                                {bots.map(bot => (
                                    <div key={bot._id} className="bot-item glass-card card-glow">
                                        <div className="bot-item-main">
                                            <div className="bot-avatar-wrap">
                                                <img src={bot.avatar} alt={bot.name} />
                                            </div>
                                            <div className="bot-details">
                                                <div className="bot-name-row">
                                                    <h4>{bot.name}</h4>
                                                    <span className="bot-username">@{bot.username}</span>
                                                    <span className="bot-badge">BOT</span>
                                                </div>
                                                <div className="bot-token-box">
                                                    <Key size={14} />
                                                    <input
                                                        type={visibleTokenId === bot._id ? "text" : "password"}
                                                        value={bot.token}
                                                        readOnly
                                                    />
                                                    <button onClick={() => setVisibleTokenId(visibleTokenId === bot._id ? null : bot._id)} className="token-toggle-btn">
                                                        {visibleTokenId === bot._id ? "Hide" : "Show"}
                                                    </button>
                                                    <button onClick={() => copyToken(bot.token)} className="token-copy-btn"><Copy size={14} /></button>
                                                </div>
                                            </div>
                                            <button className="bot-delete-btn" onClick={() => handleDeleteBot(bot._id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {bots.length === 0 && !showCreateForm && (
                                <div className="empty-bots">
                                    <BotIcon size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                    <p>You haven't created any Stride bots yet.</p>
                                </div>
                            )}

                            {!showCreateForm ? (
                                <button className="create-bot-btn" onClick={() => setShowCreateForm(true)}>
                                    <Plus size={20} />
                                    <span>Create New Bot</span>
                                </button>
                            ) : (
                                <form className="create-bot-form glass-card animate-slide-up" onSubmit={handleCreateBot}>
                                    <h4>Register New Bot</h4>
                                    <div className="form-group">
                                        <label>Display Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Music Hero"
                                            value={newBotName}
                                            onChange={e => setNewBotName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Unique Handle</label>
                                        <div className="handle-input">
                                            <span>@</span>
                                            <input
                                                type="text"
                                                placeholder="bot_username"
                                                value={newBotUsername}
                                                onChange={e => setNewBotUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="text-btn" onClick={() => setShowCreateForm(false)}>Cancel</button>
                                        <button type="submit" className="primary-btn">Create Bot</button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BotDashboard;
