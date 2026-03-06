import { useState, memo, useRef, useEffect } from 'react';
import config from '../../config';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, BadgeCheck } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import './Post.css';
import ShareModal from '../common/ShareModal';

import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CommentsModal from '../common/CommentsModal';
import ConfirmModal from '../common/ConfirmModal';
import { ShieldAlert, Play } from 'lucide-react';
import { formatTime } from '../../utils/timeUtils';
import UserAvatar from '../common/UserAvatar';
import BlurImage from '../common/BlurImage';
import StreakBadge from '../common/StreakBadge';
import ReportModal from '../common/ReportModal';


const Post = memo(({ post }) => {
    if (!post) return null;
    const { t } = useTranslation();
    const { toggleLike, deletePost, toggleSavePost, savedPosts, editPost } = useContent();
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.caption || '');
    const [showSensitive, setShowSensitive] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);

    // Intersection Observer for Video Playback Performance
    const videoRef = useRef(null);

    useEffect(() => {
        if (!videoRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoRef.current?.play().catch(() => {
                        // Suppress auto-play restriction errors on mobile browsers silently
                    });
                } else {
                    videoRef.current?.pause();
                }
            },
            { threshold: 0.5 } // Trigger when 50% of the video is visible
        );

        observer.observe(videoRef.current);

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, []);

    // MongoDB uses _id, local new posts might use id
    const postId = post._id || post.id;
    const isLiked = user && post.likes?.includes(user?.email);
    const isSaved = savedPosts?.some(p => (p._id || p.id) === postId);

    const isOwner = user && (
        String(post.userId) === String(user.id || user._id) ||
        String(post.userEmail) === String(user.email) ||
        String(post.userId) === String(user.email) ||
        String(post.username) === String(user.username)
    );

    const handleShareToUser = async (targetUser) => {
        try {
            const res = await fetch(`${config.API_URL}/api/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: user.email,
                    to: targetUser.email,
                    text: t('feed.sharedAPost', { username: post.username }),
                    sharedContent: {
                        type: 'post',
                        id: postId,
                        thumbnail: post.contentUrl,
                        title: `${post.username}'s Post`
                    }
                })
            });
            if (res.ok) showToast(t('feed.postShared', { name: targetUser.name }), 'success');
        } catch (error) {
            console.error('Failed to share post:', error);
        }
    };

    const handleEditSave = async () => {
        if (editContent.trim() === post.caption) {
            setIsEditing(false);
            return;
        }
        const success = await editPost(postId, editContent);
        if (success) {
            showToast(t('feed.postUpdated'), 'success');
            setIsEditing(false);
        } else {
            showToast(t('feed.updateFailed'), 'error');
        }
    };

    const handleSave = () => {
        toggleSavePost(post);
        showToast(isSaved ? t('feed.postUnsaved') : t('feed.postSaved'), 'success');
    };

    const handleReportSubmit = async (reportData) => {
        const success = await reportContent(reportData);
        if (success) {
            showToast(t('feed.postReported'), 'success');
        } else {
            showToast(t('common.error'), 'error');
        }
    };

    return (
        <article className="post-card">
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={async () => {
                    const success = await deletePost(postId);
                    if (success) {
                        showToast(t('feed.postDeleted'), 'success');
                    } else {
                        showToast(t('feed.deleteFailed'), 'error');
                    }
                }}
                title={t('feed.deletePost')}
                message={t('feed.deletePostConfirm')}
                confirmText={t('common.delete')}
                type="danger"
            />
            <div className="post-header">
                <div className="post-user">
                    <UserAvatar
                        user={{
                            username: post.username,
                            avatar: post.userAvatar,
                            activeAvatarFrame: post.userActiveAvatarFrame
                        }}
                        size="sm"
                    />
                    <div className="user-details" onClick={() => navigate(`/profile/${post.username}`)} style={{ cursor: 'pointer' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className={post.userUnlockedPerks?.includes('gold_name') ? 'gold-username' : ''}>
                            {post.username}
                            {post.isOfficial && <BadgeCheck size={14} color="var(--color-primary)" fill="var(--color-primary-glow)" />}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p>{formatTime(post.timestamp)}</p>
                            <StreakBadge size="sm" />
                            {post.isSensitive && (
                                <span className="sensitive-badge">
                                    <ShieldAlert size={12} />
                                    {t('feed.sensitiveContent')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="post-more-container">
                    <button className="more-btn" onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}>
                        <MoreHorizontal size={20} />
                    </button>
                    {showMore && (
                        <div className="post-more-dropdown glass-card animate-in" onClick={e => e.stopPropagation()}>
                            {isOwner && (
                                <>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                        setEditContent(post.caption || '');
                                        setShowMore(false);
                                    }}>{t('feed.editPost')}</button>
                                    <button className="delete-btn" onClick={async (e) => {
                                        e.stopPropagation();
                                        setShowMore(false);
                                        setIsConfirmOpen(true);
                                    }} style={{ color: '#ff4b4b' }}>{t('feed.deletePost')}</button>
                                </>
                            )}
                            <button onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/messages?user=${post.userEmail || post.userId || post.username}`);
                                setShowMore(false);
                            }}>{t('feed.messageUser')}</button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                if (!user) return showToast(t('feed.pleaseLoginReport'), 'error');
                                setIsReportOpen(true);
                                setShowMore(false);
                            }}>{t('feed.reportPost')}</button>
                            {(isOwner || user?.isAdmin) && (
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    showToast(t('feed.featurePost'), 'success');
                                    setShowMore(false);
                                }}>{t('feed.featurePost')}</button>
                            )}
                            {user?.isAdmin && (
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(post.serverId ? `/servers/${post.serverId}/moderation` : '/admin');
                                    setShowMore(false);
                                }} style={{ color: 'var(--accent-primary)' }}>{t('feed.managePost')}</button>
                            )}
                            <button onClick={(e) => {
                                // Copy link logic
                                e.stopPropagation();
                                setShowMore(false);
                                showToast(t('feed.linkCopied'), 'success');
                            }}>{t('feed.copyLink')}</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="post-content">
                {(post.type === 'video' || post.type === 'reel') ? (
                    <div className="post-image-container">
                        <video
                            ref={videoRef}
                            src={getImageUrl(post.contentUrl)}
                            poster={getImageUrl(post.posterUrl || post.contentUrl, 'media')}
                            className="post-image"
                            muted
                            loop
                            playsInline
                            preload="none"
                            onMouseEnter={(e) => e.target.play()}
                        />
                        <div className="video-indicator">
                            <Play size={20} fill="white" />
                        </div>
                    </div>
                ) : (post.type === 'image' || post.type === 'post' || !post.type) && post.contentUrl && (
                    <div className="post-image-container">
                        {post.isLocked && (
                            <img
                                src={getImageUrl(null, 'media')} // Empty or default image for locked
                                alt="Locked content preview"
                                className="post-image blur-active"
                                loading="lazy"
                            />
                        )}
                        {!post.isLocked && (
                            <BlurImage
                                src={post.contentUrl}
                                alt="Post content"
                                className={`post-image ${post.isSensitive && !showSensitive ? 'blur-active' : ''}`}
                                type="post"
                            />
                        )}


                        {post.isLocked && (
                            <div className="locked-content-overlay animate-in" onClick={(e) => e.stopPropagation()}>
                                <ShieldAlert size={40} color="var(--color-primary)" />
                                <h3>{t('feed.exclusiveContent')}</h3>
                                <p>{t('feed.exclusiveContentDesc')}</p>

                                <div className="unlock-actions" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    {post.unlockPrice > 0 && (
                                        <button className="primary-btn" onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                                const token = localStorage.getItem('stride_token') || localStorage.getItem('token');
                                                const res = await fetch(`${config.API_URL}/api/creator/unlock-post`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                    body: JSON.stringify({ postId })
                                                });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    showToast(t('feed.contentUnlocked'), 'success');
                                                    if (refreshUser) refreshUser(); // Refresh balance
                                                    // In a real app we'd update context state, but reload is safe for Phase 1
                                                    setTimeout(() => window.location.reload(), 1000);
                                                } else {
                                                    showToast(data.error || t('feed.unlockFailed'), 'error');
                                                }
                                            } catch (err) {
                                                showToast(t('feed.networkError'), 'error');
                                            }
                                        }}>
                                            {t('feed.unlockFor', { price: post.unlockPrice })}
                                        </button>
                                    )}

                                    {post.requiredTier > 0 && post.serverId && (
                                        <button className="secondary-btn" onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/servers/${post.serverId}`);
                                            // showToast('Subscribe to this server to unlock.', 'info');
                                        }}>
                                            {t('feed.viewServerTier')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {!post.isLocked && post.isSensitive && !showSensitive && (
                            <div className="sensitive-content-overlay animate-in" onClick={(e) => e.stopPropagation()}>
                                <ShieldAlert size={40} color="#ff4b4b" />
                                <p>{t('feed.sensitiveContentWarning')}</p>
                                <button className="show-sensitive-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSensitive(true);
                                }}>
                                    {t('feed.showContent')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {isEditing ? (
                    <div className="edit-caption-form" onClick={e => e.stopPropagation()}>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="edit-caption-input"
                            autoFocus
                        />
                        <div className="edit-actions">
                            <button className="cancel-btn" onClick={() => setIsEditing(false)}>{t('common.cancel')}</button>
                            <button className="save-btn" onClick={handleEditSave}>{t('common.save')}</button>
                        </div>
                    </div>
                ) : post.caption && (
                    <div className="post-caption">
                        {post.caption.split(/(\s+)/).map((part, i) => {
                            if (part.startsWith('#')) {
                                return (
                                    <span
                                        key={i}
                                        className="hashtag"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/search?q=${encodeURIComponent(part)}`);
                                        }}
                                        style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        {part}
                                    </span>
                                );
                            }
                            return part;
                        })}
                    </div>
                )}
            </div>

            <div className="post-footer">
                <div className="post-actions-main">
                    <button
                        className={`post-action ${isLiked ? 'liked' : ''}`}
                        onClick={() => toggleLike(postId, user?.email)}
                    >
                        <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                        <span>{post.likes?.length || 0}</span>
                    </button>
                    <button className="post-action" onClick={() => setIsCommentsOpen(true)}>
                        <MessageCircle size={24} />
                        <span>{post.comments?.length || 0}</span>
                    </button>
                    <button className="post-action" onClick={() => setIsShareModalOpen(true)}>
                        <Share2 size={24} />
                    </button>
                </div>
                <button
                    className={`post-action save-btn ${isSaved ? 'saved' : ''}`}
                    onClick={handleSave}
                >
                    <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
                </button>
            </div>

            <CommentsModal
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}
                postId={postId}
                comments={post.comments}
                username={post.username}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                type="post"
                data={{
                    id: postId,
                    title: `${post.username}'s Post`,
                    subtitle: post.caption || 'Post',
                    image: post.contentUrl
                }}
            />

            <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                targetType="post"
                targetId={postId}
                targetOwnerId={post.userEmail || post.userId}
                onSubmit={handleReportSubmit}
            />
        </article >
    );
});

export default Post;
