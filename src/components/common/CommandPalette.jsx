import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Zap, Hash, User, MessageSquare, ArrowRight, X, Mic, MicOff, Home, LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShortcuts } from '../../context/ShortcutContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import config from '../../config';
import './CommandPalette.css';

const COMMANDS = [
    { icon: <Home size={18} />, label: 'Home', action: '/home', description: 'Go to main feed' },
    { icon: <MessageSquare size={18} />, label: 'Direct Messages', action: '/messages', description: 'Open your DMs' },
    { icon: <Hash size={18} />, label: 'Explore', action: '/explore', description: 'Find new servers' },
    { icon: <Mic size={18} />, label: 'Toggle Mute', action: 'toggle-mute', description: 'Mute/Unmute microphone' },
    { icon: <LogOut size={18} />, label: 'Logout', action: 'logout', description: 'Sign out of Stride' }
];

const CommandPalette = () => {
    const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useShortcuts();
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ users: [], servers: [], messages: [] });
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isCommandPaletteOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isCommandPaletteOpen]);

    useEffect(() => {
        if (!query.trim() || query.startsWith('/')) {
            setResults({ users: [], servers: [], messages: [] });
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            setAiSuggestion(null);
            try {
                if (query.startsWith('?')) {
                    const res = await fetch(`${config.API_URL}/api/ai/semantic-nav`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: query.substring(1) })
                    });
                    const data = await res.json();
                    setAiSuggestion(data);
                } else {
                    const res = await fetch(`${config.API_URL}/api/search/global?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setResults(data);
                    }
                }
            } catch (err) {
                console.error('CMD Palette Search Error:', err);
            } finally {
                setLoading(false);
            }
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleAction = (item) => {
        if (typeof item === 'string' || item.action) {
            const action = typeof item === 'string' ? item : item.action;

            if (action.startsWith('/')) {
                navigate(action);
            } else if (action === 'toggle-mute') {
                showToast("Microphone toggled (Mock)", "success");
            } else if (action === 'logout') {
                logout();
            }
        } else if (item.username) {
            navigate(`/profile/${item.username}`);
        } else if (item.id !== undefined) {
            navigate(`/servers/${item.id}`);
        } else if (item.serverId) {
            navigate(`/servers/${item.serverId}/${item.channelId}`);
        }

        setIsCommandPaletteOpen(false);
    };

    if (!isCommandPaletteOpen) return null;

    const filteredCommands = COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.replace('/', '').toLowerCase())
    );

    return (
        <div className="command-palette-overlay" onClick={() => setIsCommandPaletteOpen(false)}>
            <div className="command-palette-container glass-panel" onClick={e => e.stopPropagation()}>
                <div className="command-palette-search">
                    <Search size={20} className="search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search... (Try '?' for AI Assistant)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (aiSuggestion) handleAction(aiSuggestion.targetUrl);
                                else handleAction(query.startsWith('/') ? filteredCommands[0] : results.users[0] || results.servers[0] || filteredCommands[0]);
                            }
                            if (e.key === 'Escape') setIsCommandPaletteOpen(false);
                        }}
                    />
                    <div className="command-palette-shortcut">ESC</div>
                </div>

                <div className="command-palette-results custom-scrollbar">
                    {query.startsWith('/') || !query.trim() ? (
                        <div className="section">
                            <div className="section-header">Quick Actions</div>
                            {filteredCommands.map((cmd, i) => (
                                <div key={i} className="result-item action" onClick={() => handleAction(cmd)}>
                                    <div className="item-icon">{cmd.icon}</div>
                                    <div className="item-info">
                                        <div className="item-title">{cmd.label}</div>
                                        <div className="item-desc">{cmd.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : aiSuggestion ? (
                        <div className="section ai-suggestion animate-in">
                            <div className="section-header">AI Assistant Suggestion</div>
                            <div className="result-item ai-nav" onClick={() => handleAction(aiSuggestion.targetUrl)}>
                                <div className="item-icon ai"><Sparkles size={18} /></div>
                                <div className="item-info">
                                    <div className="item-title">{aiSuggestion.label}</div>
                                    <div className="item-desc">{aiSuggestion.explanation}</div>
                                </div>
                                <ArrowRight size={14} />
                            </div>
                        </div>
                    ) : (
                        <>
                            {results.servers.length > 0 && (
                                <div className="section">
                                    <div className="section-header">Servers</div>
                                    {results.servers.map((server, i) => (
                                        <div key={i} className="result-item" onClick={() => handleAction(server)}>
                                            <div className="item-icon server">
                                                {server.icon ? <img src={server.icon} alt="" /> : <Hash size={18} />}
                                            </div>
                                            <div className="item-info">
                                                <div className="item-title">{server.name}</div>
                                                <div className="item-desc">{server.description || 'Striders Community'}</div>
                                            </div>
                                            <ArrowRight size={14} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {results.users.length > 0 && (
                                <div className="section">
                                    <div className="section-header">Users</div>
                                    {results.users.map((u, i) => (
                                        <div key={i} className="result-item" onClick={() => handleAction(u)}>
                                            <div className="item-icon user">
                                                <img src={u.avatar || '/default-avatar.png'} alt="" />
                                            </div>
                                            <div className="item-info">
                                                <div className="item-title">{u.name}</div>
                                                <div className="item-desc">@{u.username}</div>
                                            </div>
                                            <ArrowRight size={14} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {results.messages.length > 0 && (
                                <div className="section">
                                    <div className="section-header">Messages</div>
                                    {results.messages.map((msg, i) => (
                                        <div key={i} className="result-item message" onClick={() => handleAction(msg)}>
                                            <div className="item-icon"><MessageSquare size={18} /></div>
                                            <div className="item-info">
                                                <div className="item-title">{msg.username}</div>
                                                <div className="item-desc">{msg.text}</div>
                                            </div>
                                            <ArrowRight size={14} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {loading && <div className="palette-loading">Searching Stride...</div>}
                            {!loading && results.users.length === 0 && results.servers.length === 0 && results.messages.length === 0 && query.trim() && (
                                <div className="no-palette-results">No results found for "{query}"</div>
                            )}
                        </>
                    )}
                </div>

                <div className="command-palette-footer">
                    <div className="footer-tip">
                        <kbd>↑↓</kbd> to navigate <kbd>Enter</kbd> to select <kbd>Esc</kbd> to close
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
