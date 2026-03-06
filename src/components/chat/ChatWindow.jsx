import { useState, useRef, useEffect } from 'react';
import { Send, Phone, Video, Smile, Sticker, Search, X, Globe, BadgeCheck, MoreVertical, Reply, Pin, Trash2, MapPin, ArrowLeft, Image, Edit2, Mic, Square, MessageSquare, Flag, Gem, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCall } from '../../context/CallContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useHaptics } from '../../context/HapticContext';
import { getImageUrl } from '../../utils/imageUtils';
import '../../components/common/IconBtn.css';
import './Chat.css';
import GifPicker from '../common/GifPicker';
import config from '../../config';
import { uploadToCloudinary, uploadEncryptedToCloudinary } from '../../utils/cloudinaryUtils';
import { useSecurity } from '../../context/SecurityContext';
import { encryptionService } from '../../utils/EncryptionService';

import UserAvatar from '../common/UserAvatar';
import PollCreator from './PollCreator';
import { BarChart3, CheckCircle2 } from 'lucide-react';
import Lottie from 'lottie-react';
import TipModal from './TipModal';

const EMOJI_CATEGORIES = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🥴'],
    'People': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💃', '🕺', '👫', '👭', '👬'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '蛛', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦏', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🦚', '🦜', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'],
    'Food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', 'バター', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕️', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽', '🥣', '🥡', '🥢', '🧂'],
    'Activities': ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', 'ドレッサー', '🏒', '🏑', '🥍', ' cricket', '🥅', '⛳️', '🪁', '🏹', '宿題', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🤼‍♀️', '🤼', '🤸‍♀️', '🤸', '⛹️‍♀️', '⛹️', '🤺', '🤾‍♀️', '🤾', '🏌️‍♀️', '平衡', '🏇', '🧘‍♀️', '🧘', '🏄', '🏊', '🤽‍♀️', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', 'ギター', '🪕', 'バイオリン', '🎲', '♟', '🎯', 'ボーリング', '🎮', '🎰', '🧩']
};

const ChatWindow = ({
    activeChat,
    onSendMessage,
    onBack,
    showHeader = true,
    isAdmin = false,
    canManageMessages = false,
    isReadOnly = false,
    canPostInReadOnly = false,
    onPin,
    onDelete,
    onEdit,
    onReact,
    onAvatarClick,
    onOpenThread,
    showLocation = true,
    isDirect = false
}) => {
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [activeEmojiCategory, setActiveEmojiCategory] = useState('Smileys');
    const [isLocating, setIsLocating] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
    const [linkPreview, setLinkPreview] = useState(null);
    const [isFetchingLink, setIsFetchingLink] = useState(false);
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [showTipModal, setShowTipModal] = useState(false);

    // Voice recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);

    const [translatedMessages, setTranslatedMessages] = useState({});
    const [typingUser, setTypingUser] = useState(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const fileInputRef = useRef(null);
    const chatContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const [serverEmojis, setServerEmojis] = useState([]);
    const [serverStickers, setServerStickers] = useState([]);
    const { showToast } = useToast();
    const { startCall } = useCall();
    const { socket, isUserOnline } = useSocket();
    const { user } = useAuth();
    const { impactLight, impactMedium } = useHaptics();
    const { encryptMessage, decryptMessage, getGroupKey } = useSecurity();


    const handleReport = async (msg) => {
        try {
            const res = await fetch(`${config.API_URL}/api/messages/${msg._id || msg.id}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serverId: activeChat?.id,
                    userEmail: user?.email,
                    reason: 'Inappropriate content'
                })
            });
            if (res.ok) {
                showToast("Report submitted. Thanks for keeping Stride safe!", "success");
            } else {
                showToast("Failed to submit report", "error");
            }
        } catch (e) {
            showToast("Reporting service unavailable", "error");
        }
    };

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeChat?.messages]);

    useEffect(() => {
        setInputText('');
        setShowEmojiPicker(false);
        setShowGifPicker(false);
        setTypingUser(null);
        setReplyingTo(null);
        setEditingMessageId(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }, [activeChat?.id, activeChat?.username]);

    useEffect(() => {
        if (activeChat?.serverId) {
            // Fetch Emojis
            fetch(`${config.API_URL}/api/servers/${activeChat.serverId}/emojis`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setServerEmojis(data);
                })
                .catch(err => console.error("Failed to fetch server emojis:", err));

            // Fetch Stickers
            fetch(`${config.API_URL}/api/stickers?serverId=${activeChat.serverId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setServerStickers(data);
                })
                .catch(err => console.error("Failed to fetch server stickers:", err));
        } else {
            setServerEmojis([]);
            setServerStickers([]);
        }
    }, [activeChat?.serverId]);

    // Typing and Read Receipt Listeners
    useEffect(() => {
        if (!socket || !activeChat) return;

        const handleTyping = ({ from, fromName, typing }) => {
            if (fromName === activeChat.username || from === activeChat.id) {
                setTypingUser(typing ? fromName : null);
            }
        };

        const handleServerTyping = ({ fromName, typing, channelId, serverId }) => {
            // Check if this typing event is for the CURRENT channel we are looking at
            // We unfortunately don't have serverId/channelId props explicitly down here, 
            // but we can assume if activeChat is a channel (has no 'username' but has 'messages'), 
            // and maybe we just trust the parent routing for now.
            // A more robust way is to pass `activeChannelId` down, but for now we'll just check if fromName isn't us.
            if (fromName !== user?.username) {
                setTypingUser(typing ? fromName : null);
            }
        };

        socket.on('user-typing', handleTyping);
        socket.on('server-user-typing', handleServerTyping);

        return () => {
            socket.off('user-typing', handleTyping);
            socket.off('server-user-typing', handleServerTyping);
        };
    }, [socket, activeChat, user?.username]);

    // Read Receipt Logic
    useEffect(() => {
        if (!socket || !activeChat || !activeChat.messages) return;

        const lastThemMessage = [...activeChat.messages].reverse().find(m => !m.isMe);
        if (lastThemMessage && lastThemMessage.status !== 'read') {
            socket.emit('message-read', {
                messageId: lastThemMessage._id || lastThemMessage.id,
                fromId: user.id
            });
        }
    }, [activeChat?.messages?.length, socket]);

    if (!activeChat) {
        return (
            <div className="chat-window-v2-root flex-center" style={{ height: '100%', color: 'rgba(255,255,255,0.7)' }}>
                <div style={{ textAlign: 'center' }}>
                    <Search size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>Select a conversation to start chatting</p>
                </div>
            </div>
        );
    }

    const handleInputChange = (e) => {
        const text = e.target.value;
        setInputText(text);

        if (!socket || !activeChat) return;

        // URL Detection for Rich Link Previews
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);
        if (matches && matches.length > 0) {
            const lastUrl = matches[matches.length - 1];
            if (!linkPreview || linkPreview.originalUrl !== lastUrl) {
                fetchLinkPreview(lastUrl);
            }
        } else if (linkPreview) {
            setLinkPreview(null);
        }

        // Determine if we are in a server or DM based on activeChat structure
        // DMs usually have a `username` field for the other person, Servers don't (they are just channel data)
        const isServerChannel = !activeChat.username;

        if (isServerChannel) {
            // Need the URL/Router context to get Server ID and Channel ID reliably? 
            // Actually, in ServerView, we emit join-server-channel. 
            // For now, let's emit a generic typing-start if possible, or we need to pass server/channel IDs down.
            // Assuming we added serverId and channelId to activeChat object in ServerView...
            if (activeChat.serverId && activeChat.channelId) {
                socket.emit("server-typing-start", { serverId: activeChat.serverId, channelId: activeChat.channelId, fromName: user.username });
            }
        } else {
            socket.emit("typing-start", { to: activeChat.id || activeChat._id, fromName: user.username });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            if (isServerChannel) {
                if (activeChat.serverId && activeChat.channelId) {
                    socket.emit("server-typing-stop", { serverId: activeChat.serverId, channelId: activeChat.channelId, fromName: user.username });
                }
            } else {
                socket.emit("typing-stop", { to: activeChat.id || activeChat._id });
            }
        }, 2000);
    };

    const handleSendMsg = () => {
        if (!inputText.trim() && !linkPreview) return;

        const sharedContent = linkPreview ? {
            type: 'link',
            title: linkPreview.title,
            description: linkPreview.description,
            thumbnail: linkPreview.image,
            url: linkPreview.originalUrl
        } : null;

        // Clear typing indicator instantly on send
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        const isServerChannel = !activeChat.username;
        if (socket) {
            if (isServerChannel) {
                if (activeChat.serverId && activeChat.channelId) {
                    socket.emit("server-typing-stop", { serverId: activeChat.serverId, channelId: activeChat.channelId, fromName: user.username });
                }
            } else {
                socket.emit("typing-stop", { to: activeChat.id || activeChat._id });
            }
        }

        if (editingMessageId && onEdit) {
            onEdit(editingMessageId, inputText);
        } else {
            onSendMessage(inputText, 'text', replyingTo ? { replyTo: replyingTo._id || replyingTo.id } : null, sharedContent);
        }

        setInputText('');
        setReplyingTo(null);
        setEditingMessageId(null);
        setLinkPreview(null); // Clear link preview after sending
    };

    const handleCall = (type) => {
        startCall(activeChat, type);
    };

    const fetchLinkPreview = async (url) => {
        setIsFetchingLink(true);
        try {
            const res = await fetch(`${config.API_URL}/api/link-preview?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (data && !data.error) {
                setLinkPreview({ ...data, originalUrl: url });
            }
        } catch (err) {
            console.error("Link preview error:", err);
        } finally {
            setIsFetchingLink(false);
        }
    };

    const handleEmojiClick = (emoji) => {
        impactLight();
        const textToInsert = typeof emoji === 'string' ? emoji : `:${emoji.name}:`;
        handleInputChange({ target: { value: inputText + textToInsert } });
    };

    const handleStickerClick = (sticker) => {
        impactMedium();
        onSendMessage(sticker.url, 'sticker', null, { stickerId: sticker._id, format: sticker.format });
        setShowEmojiPicker(false);
    };

    const parseMessageContent = (msg) => {
        if (!msg.text) return null;
        if (!msg.customEmojis || msg.customEmojis.length === 0) return msg.text;

        const parts = msg.text.split(/(:[a-zA-Z0-9_]{2,32}:)/g);
        return parts.map((part, i) => {
            if (part.startsWith(':') && part.endsWith(':')) {
                const emojiName = part.slice(1, -1);
                const emoji = msg.customEmojis.find(e => e.name === emojiName);
                if (emoji) {
                    return <img key={i} src={emoji.url} alt={part} className="custom-emoji-inline" title={part} />;
                }
            }
            return part;
        });
    };



    const handleVote = (messageId, optionIndex) => {
        if (!socket || !user) return;
        socket.emit("cast-vote", {
            messageId,
            optionIndex,
            userEmail: user.email,
            isDirect
        });
    };

    const handleCreatePoll = (pollData) => {
        onSendMessage(null, 'poll', pollData);
        setShowPollCreator(false);
    };

    const handleToggleRecording = async () => {
        if (isRecording) {
            // Stop Recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
            setRecordingDuration(0);
        } else {
            // Start Recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    stream.getTracks().forEach(track => track.stop()); // release mic

                    const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
                    setUploadingMedia(true);

                    try {
                        let uploadedData;
                        const serverId = activeChat.serverId;
                        const isE2EE = isDirect || (serverId && await getGroupKey(serverId));

                        if (isE2EE) {
                            uploadedData = await uploadEncryptedToCloudinary(file);
                        } else {
                            const url = await uploadToCloudinary(file);
                            uploadedData = url ? { url } : null;
                        }

                        if (uploadedData) {
                            onSendMessage('Sent a voice message', 'audio', null, {
                                mediaUrl: uploadedData.url,
                                mediaType: 'audio',
                                encryptedMedia: uploadedData.key ? {
                                    key: uploadedData.key,
                                    iv: uploadedData.iv,
                                    type: uploadedData.type || 'audio/webm'
                                } : null
                            });
                        }
                    } catch (error) {
                        showToast('Failed to upload voice message', 'error');
                    } finally {
                        setUploadingMedia(false);
                    }
                };


                mediaRecorder.start();
                setIsRecording(true);

                // Track duration
                setRecordingDuration(0);
                recordingIntervalRef.current = setInterval(() => {
                    setRecordingDuration(prev => prev + 1);
                }, 1000);

            } catch (err) {
                showToast('Microphone access denied', 'error');
            }
        }
    };

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleLocationShare = () => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser', 'error');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                onSendMessage(null, 'location', { type: 'location', lat: latitude, lng: longitude, url: locationUrl, title: 'Shared Location' });
                setIsLocating(false);
            },
            (error) => {
                showToast('Unable to retrieve location.', 'error');
                setIsLocating(false);
            }
        );
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingMedia(true);
        try {
            let uploadedData;
            const serverId = activeChat.serverId;
            const isE2EE = isDirect || (serverId && await getGroupKey(serverId));

            if (isE2EE) {
                uploadedData = await uploadEncryptedToCloudinary(file);
            } else {
                const url = await uploadToCloudinary(file);
                uploadedData = url ? { url } : null;
            }

            if (uploadedData) {
                const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
                onSendMessage(mediaType === 'video' ? 'Sent a video' : 'Sent an image', 'text', null, {
                    mediaUrl: uploadedData.url,
                    mediaType,
                    encryptedMedia: uploadedData.key ? {
                        key: uploadedData.key,
                        iv: uploadedData.iv,
                        type: uploadedData.type || file.type
                    } : null
                });
            }
        } catch (error) {
            showToast('Failed to upload media', 'error');
        } finally {
            setUploadingMedia(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };


    const handleTranslate = (index, text) => {
        if (translatedMessages[index]) {
            const newTranslations = { ...translatedMessages };
            delete newTranslations[index];
            setTranslatedMessages(newTranslations);
            return;
        }
        setTranslatedMessages(prev => ({ ...prev, [index]: `[Translated]: ${text}` }));
    };

    const groupMessagesByDate = (msgs) => {
        const groups = [];
        msgs.forEach(msg => {
            const date = msg.timestamp ? new Date(msg.timestamp) : new Date();
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);

            let label = date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            if (date.toDateString() === now.toDateString()) label = 'Today';
            else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';

            let group = groups.find(g => g.label === label);
            if (!group) {
                group = { label, messages: [] };
                groups.push(group);
            }
            group.messages.push(msg);
        });
        return groups;
    };

    const groupedMessages = groupMessagesByDate(activeChat.messages || []);

    const getStatusText = (status) => {
        if (status === 'read') return 'Done';
        if (status === 'delivered') return 'Delivered';
        return 'Sent';
    };

    return (
        <div className="chat-window glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'static', top: 'auto', margin: 0, transform: 'none' }}>
            {showHeader && (
                <div className="chat-header glass-card">
                    <div className="chat-user-info">
                        {onBack && (
                            <button className="icon-btn mobile-only" onClick={onBack} style={{ marginRight: '8px' }}>
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        {activeChat && (
                            <>
                                <UserAvatar
                                    user={{ ...activeChat, isOnline: isUserOnline(activeChat.id) }}
                                    size="sm"
                                    showOnline={true}
                                />
                                <div className="chat-user-meta">
                                    <span className="chat-username" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {activeChat.username}
                                        {activeChat.isOfficial && <BadgeCheck size={14} color="var(--color-primary)" fill="var(--color-primary-glow)" />}
                                        {activeChat.messages?.some(m => m.isE2EE) && <ShieldCheck size={14} color="#10b981" title="End-to-End Encrypted" />}
                                    </span>
                                    <span className="chat-status">{typingUser ? 'typing...' : (isUserOnline(activeChat.id) ? 'Online' : 'Offline')}</span>
                                </div>
                            </>
                        )}
                    </div>
                    {activeChat && (
                        <div className="chat-actions">
                            {activeChat.email && (
                                <button
                                    className="icon-btn"
                                    onClick={() => setShowTipModal(true)}
                                    title="Send Vibe Tokens"
                                    style={{ color: '#a78bfa' }}
                                >
                                    <Gem size={20} />
                                </button>
                            )}
                            <button className="icon-btn" onClick={() => handleCall('audio')} title="Start Audio Call"><Phone size={20} /></button>
                            <button className="icon-btn" onClick={() => handleCall('video')} title="Start Video Call"><Video size={20} /></button>
                        </div>
                    )}
                </div>
            )}

            <div className="chat-messages premium-scrollbar" ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto' }}>
                {groupedMessages.map((group, gIndex) => (
                    <div key={gIndex} className="message-group">
                        <div className="date-separator"><span>{group.label}</span></div>
                        {group.messages.map((msg, index) => {
                            const hasGoldBubble = msg?.senderPerks?.includes('gold_bubble') ||
                                (msg.isMe && user?.unlockedPerks?.includes('gold_bubble')) ||
                                ['stride', 'purushotham_mallipudi', 'Stride Official'].includes(msg.senderName) ||
                                ['stride', 'purushotham_mallipudi'].includes(msg.senderUsername);

                            const hasGoldName = msg?.senderPerks?.includes('gold_name') ||
                                (msg.isMe && user?.unlockedPerks?.includes('gold_name')) ||
                                ['stride', 'purushotham_mallipudi', 'Stride Official'].includes(msg.senderName) ||
                                ['stride', 'purushotham_mallipudi'].includes(msg.senderUsername);

                            const hasCyberpunk = msg?.senderPerks?.includes('cyberpunk_bubbles') ||
                                (msg.isMe && user?.unlockedPerks?.includes('cyberpunk_bubbles'));

                            return (
                                <div key={index} className={`message ${msg.isMe ? 'me' : 'them'} animate-in ${hasGoldBubble ? 'gold-bubble' : ''} ${hasGoldName ? 'gold-name' : ''}`}>
                                    <div className="message-sender-info">
                                        <div
                                            className="message-sender-avatar"
                                            style={{ backgroundImage: `url(${msg.senderAvatar ? getImageUrl(msg.senderAvatar, 'user') : getImageUrl(msg.senderName, 'user')})` }}
                                        />
                                    </div>
                                    <div className="message-content-wrapper">
                                        {!msg.isMe && (
                                            <div className="message-sender-name">
                                                {msg.senderName}
                                                {msg.isAI && <span className="bot-badge">BOT</span>}
                                                {msg.userTier && typeof msg.userTier === 'string' && <span className="tier-badge" data-tier={msg.userTier.toLowerCase()}>{msg.userTier}</span>}
                                            </div>
                                        )}

                                        {msg.replyToMessage && (
                                            <div className="reply-preview-bubble">
                                                <div className="reply-bar" />
                                                <div className="reply-content">
                                                    <span className="reply-user">{msg.replyToMessage.username || msg.replyToMessage.senderName}</span>
                                                    <span className="reply-text">{msg.replyToMessage.text}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div
                                            className={`message-bubble ${msg.poll ? 'poll-bubble' : msg.sharedContent ? 'shared-bubble' : msg.gif ? 'gif-bubble' : ''} ${msg.isMe && user?.unlockedPerks?.includes('cyberpunk_bubbles') ? 'cyberpunk-bubbles-perk' : ''} ${msg.sentiment ? 'vibe-glow' : ''}`}
                                            style={msg.sentiment ? { '--vibe-color': msg.sentiment.vibeColor } : {}}
                                        >
                                            {msg.poll ? (
                                                <div className="poll-container">
                                                    {console.log('[CLIENT POLL DEBUG] Rendering poll:', msg.poll)}
                                                    <div className="poll-question">{msg.poll.question || 'No Question'}</div>
                                                    <div className="poll-options">
                                                        {msg.poll.options.map((opt, optIdx) => {
                                                            const totalVotes = msg.poll.options.reduce((sum, o) => sum + (o.voters?.length || 0), 0);
                                                            const voteCount = opt.voters?.length || 0;
                                                            const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                                                            const hasVoted = opt.voters?.includes(user?.email);

                                                            return (
                                                                <div
                                                                    key={optIdx}
                                                                    className={`poll-option ${hasVoted ? 'voted' : ''}`}
                                                                    onClick={() => handleVote(msg._id || msg.id, optIdx)}
                                                                >
                                                                    <div className="poll-option-bg" style={{ width: `${percent}%` }} />
                                                                    <div className="poll-option-content">
                                                                        <span className="option-text">{opt.text}</span>
                                                                        <div className="option-meta">
                                                                            {hasVoted && <CheckCircle2 size={12} className="voted-icon" />}
                                                                            <span className="vote-percent">{percent}%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="poll-footer">
                                                        {msg.poll.options.reduce((sum, o) => sum + (o.voters?.length || 0), 0)} votes
                                                    </div>
                                                </div>
                                            ) : msg.sharedContent ? (
                                                <div className="shared-content-card" onClick={() => (msg.sharedContent.type === 'location' || (msg.sharedContent.lat && msg.sharedContent.lng)) && window.open(msg.sharedContent.url, '_blank')}>
                                                    {(msg.sharedContent.type === 'location' || (msg.sharedContent.lat && msg.sharedContent.lng)) ? (
                                                        <div className="location-preview">
                                                            <div className="map-placeholder"><MapPin size={32} color="#ff4b4b" /></div>
                                                            <div className="location-info">
                                                                <span className="shared-type">LOCATION</span>
                                                                <span className="shared-title">Current Location</span>
                                                                <span className="coords">{msg.sharedContent.lat?.toFixed(4)}, {msg.sharedContent.lng?.toFixed(4)}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <img src={msg.sharedContent.thumbnail} alt="" className="shared-thumb" />
                                                            <div className="shared-info">
                                                                <span className="shared-type">{msg.sharedContent.type?.toUpperCase() || 'SHARED'}</span>
                                                                <span className="shared-title">{msg.sharedContent.title}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ) : msg.mediaUrl ? (
                                                msg.mediaType === 'video' ? (
                                                     <DecryptedMedia mediaUrl={msg.mediaUrl} encryptedMedia={msg.encryptedMedia} className="chat-media-attachment" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                                                ) : msg.mediaType === 'audio' ? (
                                                     <DecryptedMedia mediaUrl={msg.mediaUrl} encryptedMedia={msg.encryptedMedia} />
                                                ) : msg.sharedContent?.type === 'link' ? (
                                                    <a href={msg.sharedContent.url} target="_blank" rel="noopener noreferrer" className="rich-link-card" style={{ textDecoration: 'none', display: 'block', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', overflow: 'hidden', marginTop: '4px', maxWidth: '350px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        {msg.sharedContent.thumbnail && <img src={msg.sharedContent.thumbnail} alt="" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />}
                                                        <div style={{ padding: '12px' }}>
                                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{msg.sharedContent.title}</div>
                                                            {msg.sharedContent.description && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{msg.sharedContent.description}</div>}
                                                            <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: '8px', fontWeight: 500 }}>{new URL(msg.sharedContent.url).hostname}</div>
                                                        </div>
                                                    </a>
                                                ) : (
                                                     <DecryptedMedia mediaUrl={msg.mediaUrl} encryptedMedia={msg.encryptedMedia} className="chat-media-attachment" style={{ maxWidth: "100%", borderRadius: "8px", objectFit: "cover" }} />
                                                )
                                            ) : msg.gif ? (
                                                <img src={msg.gif} alt="GIF" className="chat-gif" />
                                            ) : msg.mediaUrl && msg.mediaType === 'sticker' ? (
                                                <div className="message-sticker-container">
                                                    {msg.sharedContent?.format === 'lottie' ? (
                                                        <div className="chat-sticker lottie-sticker">
                                                            <Lottie animationData={JSON.parse(msg.text)} loop={true} />
                                                        </div>
                                                    ) : (
                                                        <img src={msg.mediaUrl} alt="Sticker" className="chat-sticker" />
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    {parseMessageContent(msg)}
                                                    {translatedMessages[index] && <div className="translated-text animate-in">{translatedMessages[index]}</div>}
                                                    {msg.isPinned && <div className="pinned-badge"><Pin size={10} /> Pinned</div>}
                                                </>
                                            )}
                                            <div className="message-meta-v2">
                                                {msg.sentiment && (
                                                    <span className="msg-vibe-label" style={{ color: msg.sentiment.vibeColor }}>
                                                        {msg.sentiment.label}
                                                    </span>
                                                )}
                                                <span className="msg-timestamp">{msg.time || new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {msg.isMe && <span className={`msg-status-v2 ${msg.status}`}>{getStatusText(msg.status)}</span>}
                                                <div className="message-actions-overlay">
                                                    <button className="msg-action-icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReplyingTo(msg); }} title="Reply">
                                                        <Reply size={14} />
                                                    </button>
                                                    {onOpenThread && (
                                                        <button className="msg-action-icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenThread(msg); }} title="Thread">
                                                            <MessageSquare size={14} />
                                                        </button>
                                                    )}
                                                    {onPin && (
                                                        <button className="msg-action-icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPin && onPin(msg); }} title="Pin">
                                                            <Pin size={14} />
                                                        </button>
                                                    )}

                                                    {/* Edit Button */}
                                                    {msg.isMe && (!msg.type || msg.type === 'text') && !msg.gif && !msg.mediaUrl && !msg.sharedContent && (
                                                        <button className="msg-action-icon edit" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingMessageId(msg._id || msg.id); setInputText(msg.text); setReplyingTo(null); }} title="Edit">
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                    {!msg.isMe && (
                                                        <button className="msg-action-icon report" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReport(msg); }} title="Report">
                                                            <Flag size={14} />
                                                        </button>
                                                    )}

                                                    {/* Delete Button */}
                                                    {(isAdmin || canManageMessages || msg.isMe || !onPin) && (
                                                        <button className="msg-action-icon delete" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete && onDelete(msg); }} title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}

                                                    {/* Translate Button */}
                                                    {!msg.isMe && !msg.gif && !msg.sharedContent && (
                                                        <button className={`msg-action-icon ${translatedMessages[index] ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTranslate(index, msg.text); }} title="Translate">
                                                            <Globe size={14} />
                                                        </button>
                                                    )}

                                                    {/* React Button */}
                                                    {onReact && (
                                                        <button className="msg-action-icon react" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReactionPickerMsgId(reactionPickerMsgId === (msg._id || msg.id) ? null : (msg._id || msg.id)); }} title="React">
                                                            <Smile size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {msg.replyCount > 0 && onOpenThread && (
                                                <div className="thread-replies-badge" onClick={() => onOpenThread(msg)}>
                                                    <MessageSquare size={12} />
                                                    <span>{msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}</span>
                                                </div>
                                            )}

                                            {/* Reactions Display */}
                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <div className="message-reactions-container">
                                                    {msg.reactions.map((r, i) => {
                                                        const hasReacted = r.users.includes(user?.email || user?.username);
                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`reaction-badge ${hasReacted ? 'active' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    impactLight(); // Haptic feedback for reacting
                                                                    onReact && onReact(msg._id || msg.id, r.emoji);
                                                                }}
                                                            >
                                                                <span className="reaction-emoji">{r.emoji}</span>
                                                                <span className="reaction-count">{r.count}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Floating Emoji Picker for Reactions */}
                                            {reactionPickerMsgId === (msg._id || msg.id) && (
                                                <div className="reaction-picker-popup glass-card animate-slide-up" onClick={e => e.stopPropagation()}>
                                                    <div className="reaction-mini-grid">
                                                        {['👍', '❤️', '😂', '🔥', '🎉', '😢', '💯', '🤔', '🙌', '💀'].map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                className="reaction-emoji-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    impactLight(); // Haptic feedback for selecting reaction emoji
                                                                    onReact && onReact(msg._id || msg.id, emoji);
                                                                    setReactionPickerMsgId(null);
                                                                }}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="chat-controls">
                {(replyingTo || linkPreview || isFetchingLink) && (
                    <div className="reply-context-bar animate-slide-up" style={{ minHeight: linkPreview ? '80px' : '40px' }}>
                        {replyingTo && (
                            <>
                                <div className="reply-icon"><Reply size={14} /></div>
                                <div className="reply-text">Replying to <strong>{replyingTo.senderName || replyingTo.username}</strong>: {replyingTo.text}</div>
                                <button className="close-reply" onClick={() => setReplyingTo(null)}><X size={14} /></button>
                            </>
                        )}

                        {isFetchingLink && (
                            <div className="reply-text" style={{ opacity: 0.6 }}>Fetching link preview...</div>
                        )}

                        {linkPreview && !isFetchingLink && (
                            <div className="link-preview-context" style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
                                {linkPreview.image && <img src={linkPreview.image} alt="" style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover' }} />}
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{linkPreview.title}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{linkPreview.description}</div>
                                </div>
                                <button className="close-reply" onClick={() => setLinkPreview(null)}><X size={14} /></button>
                            </div>
                        )}
                    </div>
                )}

                {showEmojiPicker && (
                    <div className="emoji-picker-panel glass-card animate-slide-up">
                        <div className="emoji-category-tabs">
                            {serverEmojis.length > 0 && (
                                <button
                                    className={`cat-tab ${activeEmojiCategory === 'Server' ? 'active' : ''}`}
                                    onClick={() => setActiveEmojiCategory('Server')}
                                    title="Server Emojis"
                                >
                                    <Smile size={18} color="var(--color-primary)" />
                                </button>
                            )}
                            {Object.keys(EMOJI_CATEGORIES).map(cat => (
                                <button key={cat} className={`cat-tab ${activeEmojiCategory === cat ? 'active' : ''}`} onClick={() => setActiveEmojiCategory(cat)}>{EMOJI_CATEGORIES[cat][0]}</button>
                            ))}
                        </div>
                        <div className="emoji-grid premium-scrollbar">
                            {activeEmojiCategory === 'Server' ? (
                                serverEmojis.map(emoji => (
                                    <button key={emoji._id} onClick={() => handleEmojiClick(emoji)} className="emoji-item custom-emoji-pick">
                                        <img src={emoji.url} alt={emoji.name} title={`:${emoji.name}:`} />
                                    </button>
                                ))
                            ) : (
                                EMOJI_CATEGORIES[activeEmojiCategory].map(emoji => (
                                    <button key={emoji} onClick={() => handleEmojiClick(emoji)} className="emoji-item">{emoji}</button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {showGifPicker && (
                    <GifPicker
                        serverStickers={serverStickers}
                        onSelect={(url, sticker) => {
                            if (sticker) {
                                handleStickerClick(sticker);
                            } else {
                                onSendMessage(url, 'gif');
                            }
                            setShowGifPicker(false);
                        }}
                        onClose={() => setShowGifPicker(false)}
                    />
                )}

                {showPollCreator && (
                    <PollCreator
                        onSend={handleCreatePoll}
                        onCancel={() => setShowPollCreator(false)}
                    />
                )}

                <div className="chat-input-area glass-card" style={{ opacity: isReadOnly && !canPostInReadOnly ? 0.7 : 1 }}>
                    {isReadOnly && !canPostInReadOnly ? (
                        <div style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', padding: '10px' }}># This channel is read-only.</div>
                    ) : (
                        <>
                            <div className="input-actions-left">
                                <button className="input-tool-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia}>
                                    <Image size={22} color={uploadingMedia ? 'var(--color-primary)' : 'currentColor'} className={uploadingMedia ? 'pulse' : ''} />
                                </button>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleFileUpload} />
                                <button className={`input-tool-btn ${showEmojiPicker ? 'active' : ''}`} onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}><Smile size={22} /></button>
                                <button className={`input-tool-btn ${showGifPicker ? 'active' : ''}`} onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}><Sticker size={22} /></button>
                                {onPin && (
                                    <button className={`input-tool-btn ${showPollCreator ? 'active' : ''}`} onClick={() => { setShowPollCreator(!showPollCreator); setShowEmojiPicker(false); setShowGifPicker(false); }}><BarChart3 size={22} /></button>
                                )}
                                {showLocation && <button className={`input-tool-btn ${isLocating ? 'pulse' : ''}`} onClick={handleLocationShare} title="Share Location" disabled={isLocating}><MapPin size={22} color={isLocating ? 'var(--color-primary)' : 'currentColor'} /></button>}
                            </div>
                            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                                {isRecording ? (
                                    <div className="recording-active-view chat-input-premium" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#ff4b4b' }}>
                                        <div className="recording-pulse-dot pulse-red" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff4b4b' }} />
                                        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatDuration(recordingDuration)}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginLeft: '8px' }}>Recording voice message...</span>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder={`Message ${activeChat?.username || '...'}`}
                                        className="chat-input-premium"
                                        value={inputText}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMsg()}
                                    />
                                )}

                                {!isRecording && typingUser && (
                                    <div className="typing-indicator-pop animate-slide-up" style={{
                                        position: 'absolute',
                                        top: '-25px', left: '10px',
                                        fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-glow)',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        background: 'rgba(30,30,40,0.8)', padding: '2px 8px', borderRadius: '12px', backdropFilter: 'blur(4px)'
                                    }}>
                                        {typingUser} is typing<span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
                                    </div>
                                )}
                            </div>

                            {isRecording ? (
                                <button className="send-btn-vibe recording-stop" onClick={handleToggleRecording} style={{ background: '#ff4b4b', color: 'white' }}>
                                    <Square size={18} fill="currentColor" />
                                </button>
                            ) : inputText.trim() ? (
                                <button className="send-btn-vibe can-send" onClick={handleSendMsg}>
                                    <Send size={20} />
                                </button>
                            ) : (
                                <button className="send-btn-vibe mic-btn" onClick={handleToggleRecording}>
                                    <Mic size={20} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Tip Modal */}
            {showTipModal && activeChat?.email && (
                <TipModal
                    recipientEmail={activeChat.email}
                    recipientUsername={activeChat.username}
                    onClose={() => setShowTipModal(false)}
                    onSuccess={(newBalance) => {
                        setShowTipModal(false);
                    }}
                />
            )}
        </div>
    );
};


const DecryptedMedia = ({ mediaUrl, encryptedMedia, className, style }) => {
    const [decryptedUrl, setDecryptedUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const decrypt = async () => {
            if (!encryptedMedia) {
                setDecryptedUrl(mediaUrl);
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(mediaUrl);
                const blob = await res.blob();
                const decryptedBlob = await encryptionService.decryptFile(
                    blob,
                    encryptedMedia.key,
                    encryptedMedia.iv,
                    encryptedMedia.type
                );
                const url = URL.createObjectURL(decryptedBlob);
                setDecryptedUrl(url);
            } catch (err) {
                console.error('[E2EE] Media decryption failed:', err);
            } finally {
                setLoading(false);
            }
        };

        decrypt();

        return () => {
            if (decryptedUrl && decryptedUrl.startsWith('blob:')) {
                URL.revokeObjectURL(decryptedUrl);
            }
        };
    }, [mediaUrl, encryptedMedia]);

    if (loading) return <div className="media-decrypting-spinner"></div>;
    if (!decryptedUrl) return <div className="media-decryption-error">Failed to decrypt media</div>;

    if (encryptedMedia?.type?.startsWith('video/') || (mediaUrl && mediaUrl.includes('video'))) {
        return <video src={decryptedUrl} controls className={className} style={style} />;
    }

    if (encryptedMedia?.type?.startsWith('audio/') || (mediaUrl && mediaUrl.includes('audio'))) {
        return <audio src={decryptedUrl} controls className={className} style={style} />;
    }

    return <img src={decryptedUrl} alt="Secure Media" className={className} style={style} />;
};

export default ChatWindow;

