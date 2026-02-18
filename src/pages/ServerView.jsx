import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useServer } from '../context/ServerContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import {
    Hash, Settings, Bell, Search, Menu, Users, ArrowLeft, Volume2,
    ChevronDown, ChevronRight, ChevronUp, ChevronLeft, Pin, Gift,
    HelpCircle, Video, ClipboardList, BadgeCheck, UserPlus, X, Lock,
    Heart, MessageCircle, Image as ImageIcon
} from 'lucide-react';
import ChatWindow from '../components/chat/ChatWindow';
import { ServerMenu, MembersList, SearchModal } from '../components/server/ServerInteractions';
import { CreateChannelModal, ServerSettingsModal, InviteModal, ServerProfileModal, ChannelSettingsModal, ConfirmationModal } from '../components/server/ServerModals';
import VoiceChannel from '../components/server/VoiceChannel';
import { useNotifications } from '../context/NotificationContext';
import './ServerView.css';

import MediaGallery from '../components/server/MediaGallery';

const ServerView = () => {
    const { serverId } = useParams();
    const { servers, fetchMembers, fetchRoles, fetchMessages, sendServerMessage, createChannel, deleteChannel, leaveServer, deleteServer, updateServer, updateServerProfile, toggleMobileSidebar, assignRole, loading: serversLoading } = useServer();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showToast } = useToast();
    const { unreadCount } = useNotifications();

    const server = servers.find(s => s.id === parseInt(serverId));

    const [activeChannel, setActiveChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI States
    const [showMenu, setShowMenu] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState({});
    const [showMediaGallery, setShowMediaGallery] = useState(false);

    // Feature Modal States
    const [showInvite, setShowInvite] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showPinned, setShowPinned] = useState(false);
    const [showMuteMenu, setShowMuteMenu] = useState(false);
    const [showChannelSettings, setShowChannelSettings] = useState(false);
    const [editingChannel, setEditingChannel] = useState(null);
    const [readOnlyChannels, setReadOnlyChannels] = useState({}); // { channelName: boolean }
    const [categoryList, setCategoryList] = useState([]);
    const [channelSearch, setChannelSearch] = useState('');
    const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, data: null });
    const [hasInitialSelected, setHasInitialSelected] = useState(false);

    useEffect(() => {
        if (server) {
            if (server.categories && server.categories.length > 0) {
                setCategoryList(server.categories);
            } else {
                setCategoryList([
                    { name: 'STRIDE HUB ✧', channels: server.channels.slice(0, 3) },
                    { name: 'THE VIBE ✨', channels: server.channels.slice(3, 7) },
                    { name: 'ASSISTANCE 🛠️', channels: server.channels.slice(7) }
                ]);
            }
            // Map readOnlyChannels array to object for UI
            if (server.readOnlyChannels) {
                const roObj = {};
                server.readOnlyChannels.forEach(c => roObj[c] = true);
                setReadOnlyChannels(roObj);
            }
        }
        if (server && !activeChannel && !hasInitialSelected) {
            // Prioritize #welcome or #rules for official server
            const officialDefaults = ['welcome', 'rules', 'faq'];
            const defaultChannel = server.id === 0
                ? server.channels.find(c => officialDefaults.includes(c.toLowerCase())) || server.channels[0]
                : server.channels[0];

            setActiveChannel(defaultChannel);
            setHasInitialSelected(true);
        }
    }, [server, server?.channels, server?.categories]);

    useEffect(() => {
        if (serverId) {
            fetchMembers(serverId).then(setMembers);
            fetchRoles(serverId).then(setRoles);
        }
    }, [serverId]);

    useEffect(() => {
        if (!socket) return;
        const handleStatusChange = ({ userId, status }) => {
            setMembers(prev => prev.map(m => m.id === userId ? { ...m, status } : m));
        };
        socket.on('user-status-change', handleStatusChange);
        return () => socket.off('user-status-change', handleStatusChange);
    }, [socket]);

    const handleUpdateProfile = async (nickname) => {
        const res = await updateServerProfile(server.id, user._id, { nickname });
        if (res?.success) window.location.reload();
    };

    useEffect(() => {
        if (server && activeChannel) {
            setLoading(true);
            const loadMessages = async () => {
                const data = await fetchMessages(serverId, activeChannel);
                setMessages(data);
                setLoading(false);
            };
            loadMessages();

            const interval = setInterval(async () => {
                const data = await fetchMessages(serverId, activeChannel);
                setMessages(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [serverId, activeChannel]);

    if (serversLoading) {
        return (
            <div className="flex-center h-screen bg-black" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!server) {
        return <Navigate to="/" />;
    }

    const toggleCategory = (cat) => {
        setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const getChannelIcon = (name) => {
        if (!name) return <Hash size={18} />;
        if (readOnlyChannels[name]) return <Lock size={16} style={{ color: 'var(--text-secondary)', opacity: 0.8 }} />;
        const n = name.toLowerCase();
        if (n.includes('video') || n.includes('art') || n.includes('sound')) return <Volume2 size={18} />;
        if (n.includes('giveaway')) return <Gift size={18} />;
        if (n.includes('faq')) return <HelpCircle size={18} />;
        if (n.includes('crew')) return <Video size={18} />;
        if (n.includes('recruitment')) return <ClipboardList size={18} />;
        return <Hash size={18} />;
    };

    const serverProfile = user?.serverProfiles?.find(p => p.serverId === parseInt(serverId));
    const displayName = serverProfile?.nickname || user?.username || 'Guest';

    const handleMoveCategory = async (index, direction) => {
        const newList = [...categoryList];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newList.length) return;

        const [moved] = newList.splice(index, 1);
        newList.splice(targetIndex, 0, moved);
        setCategoryList(newList);

        // Persist to backend
        const success = await updateServer(serverId, { categories: newList });
        if (success) {
            showToast(`Moved ${moved.name} ${direction}`, 'success');
        }
    };

    const hasPermission = (perm) => {
        // 1. System Admins / Server Owner (Legacy/Hardcoded)
        const isSystemAdmin = user?.username?.toLowerCase().includes('stride') ||
            user?.username?.toLowerCase().includes('purushotham');

        const isOwner = server?.ownerId === user?.username || server?.ownerId === user?.email;
        const isLegacyAdmin = server?.admins?.includes(user?.email);

        if (isSystemAdmin || isOwner || isLegacyAdmin) return true;

        // 2. Role-based permissions
        if (server?.members && Array.isArray(server.members)) {
            const member = server.members.find(m => m.userId === user?.username || m.userId === user?.email);
            if (member && member.roles && Array.isArray(member.roles)) {
                // Find roles in the server's role definitions
                // roles_data should be populated by the frontend from the server.roles array
                const userRoles = roles.filter(r => member.roles.includes(r._id) || member.roles.includes(r.id)) || [];

                // If any role has 'administrator', return true
                if (userRoles.some(r => r.permissions?.administrator)) return true;

                // Check specific permission
                if (userRoles.some(r => r.permissions?.[perm])) return true;
            }
        }

        // 3. Fallback (Default permissions for members)
        const defaultPerms = {
            createInvite: true,
            changeNickname: true,
            sendMessages: true,
            readHistory: true
        };

        return !!defaultPerms[perm];
    };

    const handleSendMessage = async (text, type = 'text') => {
        if (!user || !activeChannel) return;
        const msgData = {
            userEmail: user.email,
            username: user.username,
            userAvatar: user.avatar,
            text,
            type
        };
        const newMsg = await sendServerMessage(serverId, activeChannel, msgData);
        if (newMsg) setMessages(prev => [...prev, newMsg]);
    };

    const handlePinMessage = (msg) => {
        setMessages(prev => prev.map(m => (m.id === msg.id || m._id === msg._id) ? { ...m, isPinned: !m.isPinned } : m));
        showToast(msg.isPinned ? 'Unpinned' : 'Pinned', 'success');
    };

    const handleDeleteMessage = (msg) => {
        setMessages(prev => prev.filter(m => (m.id || m._id) !== (msg.id || msg._id)));
        showToast('Deleted', 'success');
    };

    const handleReplyMessage = (msg) => {
        showToast(`Reply to ${msg.username} (Demo)`, 'info');
    };

    const handleMute = (duration) => {
        const text = duration === -1 ? 'Notifications muted until you turn them back on' : `Notifications muted for ${duration} ${duration === 1 ? 'hour' : 'hours'}`;
        showToast(text, 'info');
        setShowMuteMenu(false);
    };

    const handleAvatarClick = (userData) => {
        setSelectedUserForProfile({
            ...userData,
            name: userData.name || userData.username || userData.senderName,
            username: userData.username || userData.senderUsername,
            avatar: userData.avatar || userData.senderAvatar
        });
    };

    const isAdmin = server.admins?.includes(user?.email) || server.ownerId === user?.username || user?.username === 'purushotham_mallipudi';

    const activeChatData = {
        username: `# ${activeChannel}`,
        messages: messages.map(m => ({
            ...m,
            isMe: m.userEmail === user?.email,
            senderName: m.username,
            senderAvatar: m.userAvatar,
            gif: m.type === 'gif' ? m.text : null
        }))
    };

    return (
        <div className="server-layout-root">
            <div className="server-view-main">
                {/* Channel Sidebar */}
                <aside className={`server-sidebar-v2 ${(activeChannel || showMediaGallery) ? 'mobile-hidden' : ''}`}>
                    <div className="server-header-box">
                        <div className="header-info" onClick={() => setShowMenu(!showMenu)}>
                            <h2 className="server-name-title">
                                <button className="icon-btn mobile-only" onClick={(e) => { e.stopPropagation(); toggleMobileSidebar(); }} style={{ marginRight: '8px' }}>
                                    <Menu size={24} />
                                </button>
                                {server.name}
                                {(server.id === 0 || server.isVerified) && <BadgeCheck size={16} fill="var(--color-primary)" color="white" />}
                            </h2>
                            <div className="server-stats-sub">{(server.members?.length || members?.length || 0).toLocaleString()} Members • Community</div>
                        </div>
                        <ChevronDown size={20} className={showMenu ? 'rotated' : ''} onClick={() => setShowMenu(!showMenu)} />
                    </div>

                    <div className="server-search-container">
                        <div className="search-bar-styled">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search"
                                value={channelSearch}
                                onChange={(e) => setChannelSearch(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    outline: 'none',
                                    width: '100%'
                                }}
                            />
                        </div>
                        <div className="icon-actions-header">
                            <ImageIcon
                                size={20}
                                onClick={() => { setShowMediaGallery(true); setActiveChannel(null); }}
                                title="Media Gallery"
                                style={{ cursor: 'pointer', color: showMediaGallery ? 'var(--color-primary)' : 'inherit' }}
                            />
                            {hasPermission('createInvite') && (
                                <UserPlus size={20} onClick={() => setShowInvite(true)} title="Invite People" style={{ cursor: 'pointer' }} />
                            )}
                            <div style={{ position: 'relative' }}>
                                <Bell size={20} onClick={() => setShowMuteMenu(!showMuteMenu)} style={{ cursor: 'pointer', color: showMuteMenu ? 'var(--color-primary)' : 'inherit' }} />
                                {showMuteMenu && (
                                    <div className="mute-dropdown-menu glass-card animate-slide-up">
                                        <div className="menu-header">Mute Notifications</div>
                                        <button onClick={() => handleMute(1)}>1 Hour</button>
                                        <button onClick={() => handleMute(8)}>8 Hours</button>
                                        <button onClick={() => handleMute(24)}>1 Day</button>
                                        <button onClick={() => handleMute(168)}>7 Days</button>
                                        <button onClick={() => handleMute(-1)}>Until I turn it back on</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="channels-scroll-area">
                        {categoryList
                            .map(cat => ({
                                ...cat,
                                channels: cat.channels.filter(ch => ch.toLowerCase().includes(channelSearch.toLowerCase()))
                            }))
                            .filter(cat => cat.channels.length > 0)
                            .map((cat, idx) => (
                                <div key={cat.name} className="channel-category">
                                    <div className="category-header" style={{ display: 'flex', alignItems: 'center' }}>
                                        <div className="category-title" onClick={() => toggleCategory(cat.name)} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                            {collapsedCategories[cat.name] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                            <span className="category-deco">{cat.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {hasPermission('manageChannels') && (
                                                <>
                                                    <ChevronUp
                                                        size={12}
                                                        className="channel-gear-icon"
                                                        onClick={(e) => { e.stopPropagation(); handleMoveCategory(idx, 'up'); }}
                                                        style={{ opacity: idx === 0 ? 0.3 : 1, cursor: idx === 0 ? 'default' : 'pointer' }}
                                                    />
                                                    <ChevronDown
                                                        size={12}
                                                        className="channel-gear-icon"
                                                        onClick={(e) => { e.stopPropagation(); handleMoveCategory(idx, 'down'); }}
                                                        style={{ opacity: idx === categoryList.length - 1 ? 0.3 : 1, cursor: idx === categoryList.length - 1 ? 'default' : 'pointer' }}
                                                    />
                                                </>
                                            )}
                                            {hasPermission('administrator') && (
                                                <Settings
                                                    size={12}
                                                    className="channel-gear-icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const action = prompt("Category: Type 'rename' or 'delete'");
                                                        if (action === 'rename') {
                                                            const newName = prompt("New name:");
                                                            if (newName) showToast(`Renamed to ${newName}`, 'success');
                                                        } else if (action === 'delete') {
                                                            if (window.confirm("Delete category?")) showToast("Deleted", 'success');
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    {!collapsedCategories[cat.name] && cat.channels.map(channel => (
                                        <div
                                            key={channel}
                                            className={`channel-pill ${activeChannel === channel ? 'active' : ''}`}
                                            onClick={() => { setActiveChannel(channel); setShowMediaGallery(false); }}
                                        >
                                            <div className="channel-icon-wrapper">
                                                {getChannelIcon(channel)}
                                            </div>
                                            <span className="channel-name-text">{channel}</span>
                                            {hasPermission('manageChannels') && (
                                                <Settings
                                                    size={14}
                                                    className="channel-gear-icon"
                                                    style={{ marginLeft: 'auto' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingChannel(channel);
                                                        setShowChannelSettings(true);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                    </div>

                    <div className="user-settings-bar">
                        <div className="user-mini-profile" onClick={() => handleAvatarClick(user)} style={{ cursor: 'pointer' }}>
                            <div className="mini-avatar">
                                <img src={user?.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                            </div>
                            <div className="mini-names">
                                <div className="mini-display-name">{displayName}</div>
                                <div className="mini-status">Online</div>
                            </div>
                        </div>
                        <div className="user-bar-actions">
                            <Settings size={20} onClick={() => setShowProfile(true)} />
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className={`server-chat-area-v2 ${(activeChannel || showMediaGallery) ? '' : 'mobile-hidden'}`}>
                    {showMediaGallery ? (
                        <MediaGallery
                            serverId={server.id}
                            onClose={() => { setShowMediaGallery(false); setActiveChannel(null); }}
                        />
                    ) : activeChannel && (activeChannel.toLowerCase().includes('voice') || activeChannel.toLowerCase().includes('lounge') || activeChannel.toLowerCase().includes('music')) ? (
                        <VoiceChannel
                            channelId={`${server.id}-${activeChannel}`}
                            channelName={activeChannel}
                            onClose={() => setActiveChannel(null)}
                        />
                    ) : (
                        <>
                            <div className="chat-header-v2">
                                <div className="header-left">
                                    <button className="icon-btn mobile-only" onClick={() => setActiveChannel(null)} style={{ marginRight: '8px' }}>
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div className="header-icon-wrapper">
                                        {activeChannel && getChannelIcon(activeChannel)}
                                    </div>
                                    <h3>{activeChannel || "Welcome"}</h3>
                                </div>
                                <div className="header-right">
                                    <Pin size={20} className="clickable-icon" onClick={() => setShowPinned(true)} />
                                    <Users size={20} className="clickable-icon" onClick={() => setShowMembers(!showMembers)} />
                                    <div className="search-input-pill">
                                        <span>Search</span>
                                        <Search size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="chat-content-v2">
                                {loading ? (
                                    <div className="flex-center h-full">
                                        <div className="loading-spinner"></div>
                                    </div>
                                ) : !activeChannel ? (
                                    <div className="flex-center h-full flex-col text-muted" style={{ color: '#949BA4', gap: '16px' }}>
                                        <Hash size={48} style={{ opacity: 0.5 }} />
                                        <p>Select a channel to start chatting</p>
                                    </div>
                                ) : (
                                    <ChatWindow
                                        activeChat={activeChatData}
                                        onSendMessage={handleSendMessage}
                                        showHeader={false}
                                        showLocation={false}
                                        isAdmin={isAdmin}
                                        canManageMessages={hasPermission('manageMessages')}
                                        isReadOnly={readOnlyChannels[activeChannel] || (server.readOnlyChannels && server.readOnlyChannels.includes(activeChannel))}
                                        canPostInReadOnly={isAdmin || hasPermission('administrator')}
                                        onPin={handlePinMessage}
                                        onDelete={handleDeleteMessage}
                                        onReply={handleReplyMessage}
                                        onAvatarClick={handleAvatarClick}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modals & Overlays */}
            <ServerMenu
                isOpen={showMenu}
                onClose={() => setShowMenu(false)}
                serverName={server.name}
                onInvite={() => setShowInvite(true)}
                onSettings={() => setShowSettings(true)}
                onCreateChannel={() => setShowCreateChannel(true)}
                canInvite={hasPermission('createInvite')}
                canManageServer={hasPermission('manageServer')}
                canManageChannels={hasPermission('manageChannels')}
                onLeave={async () => {
                    const success = await leaveServer(server.id, user.email);
                    if (success) {
                        showToast('Left server', 'success');
                        navigate('/');
                    }
                }}
            />
            <MembersList
                isOpen={showMembers}
                onClose={() => setShowMembers(false)}
                members={members}
                onMemberClick={handleAvatarClick}
            />
            <SearchModal
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
                channels={server.channels}
                members={members}
            />
            <InviteModal isOpen={showInvite} onClose={() => setShowInvite(false)} serverName={server.name} />
            <ServerSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                server={server}
                onDelete={async () => {
                    if (await deleteServer(server.id, user.email)) navigate('/');
                }}
                onUpdate={(updates) => updateServer(server.id, updates)}
                hasPermission={hasPermission}
            />
            <ServerProfileModal
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                serverName={server.name}
                currentNickname={selectedUserForProfile?.nickname || selectedUserForProfile?.username}
                canEdit={selectedUserForProfile?.id === user?._id || selectedUserForProfile?._id === user?._id ? hasPermission('changeNickname') : hasPermission('manageNicknames')}
                onSave={handleUpdateProfile}
            />

            <ChannelSettingsModal
                isOpen={showChannelSettings}
                onClose={() => setShowChannelSettings(false)}
                channelName={editingChannel}
                isReadOnly={readOnlyChannels[editingChannel]}
                onUpdate={async ({ name, isReadOnly }) => {
                    const updates = {};
                    let updated = false;

                    if (name !== editingChannel) {
                        // Handle rename
                        const newChannels = server.channels.map(c => c === editingChannel ? name : c);
                        updates.channels = newChannels;

                        // Sync readOnlyChannels if the old name was read-only
                        let newReadOnly = [...(server.readOnlyChannels || [])];
                        if (newReadOnly.includes(editingChannel)) {
                            newReadOnly = newReadOnly.map(c => c === editingChannel ? name : c);
                        }
                        // Also handle the explicit toggle from the modal
                        if (isReadOnly && !newReadOnly.includes(name)) {
                            newReadOnly.push(name);
                        } else if (!isReadOnly && newReadOnly.includes(name)) {
                            newReadOnly = newReadOnly.filter(c => c !== name);
                        }
                        updates.readOnlyChannels = newReadOnly;

                        // Sync Categories!
                        if (server.categories) {
                            updates.categories = server.categories.map(cat => ({
                                ...cat,
                                channels: cat.channels.map(c => c === editingChannel ? name : c)
                            }));
                        }
                        updated = true;
                    } else {
                        // Handle read-only toggle only
                        const currentReadOnly = server.readOnlyChannels || [];
                        const currentlyReadOnly = currentReadOnly.includes(editingChannel);

                        if (isReadOnly !== currentlyReadOnly) {
                            let newReadOnly = [...currentReadOnly];
                            if (isReadOnly) {
                                if (!newReadOnly.includes(editingChannel)) newReadOnly.push(editingChannel);
                            } else {
                                newReadOnly = newReadOnly.filter(c => c !== editingChannel);
                            }
                            updates.readOnlyChannels = newReadOnly;
                            updated = true;
                        }
                    }

                    if (updated) {
                        const success = await updateServer(serverId, updates);
                        if (success) {
                            showToast(`Updated #${name}`, 'success');
                            if (name !== editingChannel && activeChannel === editingChannel) {
                                setActiveChannel(name);
                            }
                        } else {
                            console.error('[ChannelUpdate] PATCH failed');
                            showToast('Failed to update channel', 'error');
                        }
                    }
                    setShowChannelSettings(false);
                }}
                onDelete={async () => {
                    const success = await deleteChannel(serverId, editingChannel);
                    if (success) {
                        showToast(`Deleted #${editingChannel}`, 'success');
                        setShowChannelSettings(false);
                        // If we deleted the active channel, switch to another one
                        if (activeChannel === editingChannel) {
                            const remainingChannels = server.channels.filter(c => c !== editingChannel);
                            if (remainingChannels.length > 0) setActiveChannel(remainingChannels[0]);
                            else navigate('/');
                        }
                    } else {
                        showToast('Failed to delete channel', 'error');
                    }
                }}
            />
            {showCreateChannel && (
                <CreateChannelModal
                    isOpen={showCreateChannel}
                    onClose={() => setShowCreateChannel(false)}
                    onCreate={async (nc) => {
                        if (await createChannel(server.id, nc.name, nc.type)) setActiveChannel(nc.name);
                    }}
                />
            )}

            {showPinned && (
                <PinnedMessagesModal
                    isOpen={showPinned}
                    onClose={() => setShowPinned(false)}
                    messages={messages.filter(m => m.isPinned)}
                />
            )}

            {selectedUserForProfile && (
                <UserProfileModal
                    user={selectedUserForProfile}
                    roles={roles}
                    canManageRoles={hasPermission('manageMembers')}
                    onAssignRole={async (roleId) => {
                        const success = await assignRole(server.id, selectedUserForProfile.email || selectedUserForProfile.id, roleId);
                        if (success) {
                            // Refetch members to update the UI
                            const updatedMembers = await fetchMembers(server.id);
                            setMembers(updatedMembers);
                            // Update the selected user for profile as well to reflect the change in the modal
                            const updatedUser = updatedMembers.find(m => m.email === (selectedUserForProfile.email || selectedUserForProfile.id));
                            if (updatedUser) setSelectedUserForProfile(updatedUser);
                        }
                        return success;
                    }}
                    onClose={() => setSelectedUserForProfile(null)}
                />
            )}

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                title={deleteConfirmation?.title}
                message={deleteConfirmation?.message}
                onConfirm={deleteConfirmation?.action}
            />
        </div>
    );
};

const UserProfileModal = ({ user, onClose, roles = [], canManageRoles, onAssignRole }) => {
    const { showToast } = useToast();
    const userRoles = roles.filter(r => user.roles?.includes(r._id) || user.roles?.includes(r.id));
    const availableRoles = roles.filter(r => !user.roles?.includes(r._id) && !user.roles?.includes(r.id));
    const [showRolePicker, setShowRolePicker] = useState(false);

    return (
        <div className="search-modal-overlay animate-slide-up" onClick={onClose} style={{ zIndex: 12000 }}>
            <div className="search-modal premium-creation-modal" onClick={e => e.stopPropagation()} style={{ width: '400px', padding: 0, overflow: 'hidden', borderRadius: '16px', background: '#111214' }}>
                <div style={{ height: '80px', background: 'var(--accent-gradient)', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '-35px', left: '20px', padding: '4px', background: '#111214', borderRadius: '50%' }}>
                        <img src={user.avatar || user.userAvatar} alt="" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #111214' }} />
                    </div>
                </div>
                <div style={{ padding: '40px 20px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'white' }}>{user.name || user.username}</h3>
                            <p style={{ color: 'var(--text-muted)', margin: '4px 0 12px', fontSize: '0.9rem' }}>@{user.username}</p>
                        </div>
                        <button className="icon-btn" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}><X size={18} /></button>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Roles</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {userRoles.map(role => (
                                <div key={role._id || role.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${role.color || 'var(--text-muted)'}40` }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: role.color || 'var(--text-muted)' }} />
                                    <span style={{ fontSize: '0.75rem', color: 'white' }}>{role.name}</span>
                                </div>
                            ))}
                            {canManageRoles && (
                                <button
                                    onClick={() => setShowRolePicker(!showRolePicker)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                >
                                    + Add Role
                                </button>
                            )}
                        </div>

                        {showRolePicker && (
                            <div className="glass-card animate-slide-up" style={{ marginTop: '8px', padding: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                                {availableRoles.length > 0 ? (
                                    availableRoles.map(role => (
                                        <div
                                            key={role._id || role.id}
                                            onClick={async () => {
                                                const success = await onAssignRole(role._id || role.id);
                                                if (success) {
                                                    showToast(`Added role ${role.name}`, 'success');
                                                    setShowRolePicker(false);
                                                } else {
                                                    showToast(`Failed to add role ${role.name}`, 'error');
                                                }
                                            }}
                                            className="menu-item"
                                            style={{ padding: '6px 10px', borderRadius: '4px', fontSize: '0.85rem' }}
                                        >
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: role.color || 'var(--text-muted)' }} />
                                            <span>{role.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '8px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        No roles available to add.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="primary-btn"
                            style={{ flex: 1, borderRadius: '8px', padding: '10px' }}
                            onClick={() => {
                                onClose();
                                const targetUser = user.email || user.username;
                                if (targetUser) window.location.href = `/messages?user=${targetUser}`;
                            }}
                        >
                            Message
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PinnedMessagesModal = ({ isOpen, onClose, messages }) => {
    if (!isOpen) return null;
    return (
        <div className="search-modal-overlay animate-slide-up" onClick={onClose} style={{ zIndex: 11000 }}>
            <div className="search-modal glass-card" onClick={e => e.stopPropagation()} style={{ width: '480px', maxHeight: '70vh', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                        <Pin size={20} /> Pinned Messages
                    </h3>
                    <button className="icon-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>
                <div style={{ padding: '16px', overflowY: 'auto', maxHeight: 'calc(70vh - 80px)' }} className="premium-scrollbar">
                    {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                            No pinned messages yet.
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id || msg._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '12px', borderLeft: '3px solid var(--color-primary)' }}>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                                    <img src={msg.userAvatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{msg.username}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(msg.timestamp).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.95rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>{msg.text}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServerView;
