import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './HashtagPage.css';

function HashtagPage() {
    const { tag } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [posts, setPosts] = useState([]);
    const [trendingData, setTrendingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const fetchPosts = useCallback(async (pageNum = 1) => {
        try {
            setLoading(true);
            const res = await fetch(`${baseUrl}/api/analytics/trending/hashtags/${encodeURIComponent(tag)}/posts?page=${pageNum}&limit=20`);
            if (res.ok) {
                const data = await res.json();
                if (pageNum === 1) {
                    setPosts(data.posts || []);
                } else {
                    setPosts(prev => [...prev, ...(data.posts || [])]);
                }
                setHasMore(pageNum < (data.pages || 1));
            }
        } catch (e) {
            console.error('[HASHTAG PAGE]', e);
        } finally {
            setLoading(false);
        }
    }, [tag, baseUrl]);

    const fetchTrending = useCallback(async () => {
        try {
            const res = await fetch(`${baseUrl}/api/analytics/trending/hashtags`);
            if (res.ok) {
                const allTags = await res.json();
                const found = allTags.find(t => t.tag?.toLowerCase() === tag?.toLowerCase());
                const rank = allTags.findIndex(t => t.tag?.toLowerCase() === tag?.toLowerCase()) + 1;
                setTrendingData(found ? { ...found, rank } : null);
            }
        } catch (e) { }
    }, [tag, baseUrl]);

    useEffect(() => {
        setPage(1);
        setPosts([]);
        fetchPosts(1);
        fetchTrending();
    }, [tag, fetchPosts, fetchTrending]);

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchPosts(next);
    };

    return (
        <div className="hashtag-page" id="hashtag-page">
            {/* Header */}
            <div className="hashtag-header">
                <button className="hashtag-back-btn" onClick={() => navigate(-1)} aria-label="Back">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <div className="hashtag-title-wrap">
                    <h1 className="hashtag-title">
                        <span className="hashtag-hash">#</span>{tag}
                    </h1>
                    {trendingData && (
                        <div className="hashtag-trending-badge">
                            🔥 {t('hashtag.trendingRank', { rank: trendingData.rank })} · {trendingData.count} posts
                        </div>
                    )}
                    {!trendingData && !loading && (
                        <div className="hashtag-post-count">
                            {posts.length} {t('hashtag.posts')}
                        </div>
                    )}
                </div>
            </div>

            {/* Posts Grid */}
            {loading && posts.length === 0 ? (
                <div className="hashtag-loading">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="hashtag-skeleton-card" />
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="hashtag-empty">
                    <span>🏷️</span>
                    <p>{t('hashtag.noPosts')}</p>
                </div>
            ) : (
                <>
                    <div className="hashtag-posts-grid">
                        {posts.map((post, idx) => (
                            <div key={post._id || idx} className="hashtag-post-card" id={`hashtag-post-${idx}`}>
                                {post.contentUrl ? (
                                    post.type === 'video' ? (
                                        <video
                                            src={post.contentUrl}
                                            className="hashtag-post-media"
                                            muted playsInline
                                            onMouseOver={e => e.target.play()}
                                            onMouseOut={e => { e.target.pause(); e.target.currentTime = 0; }}
                                        />
                                    ) : (
                                        <img src={post.contentUrl} alt={post.caption || 'Post'}
                                            className="hashtag-post-media" loading="lazy" />
                                    )
                                ) : (
                                    <div className="hashtag-post-text-only">
                                        <p>{post.caption}</p>
                                    </div>
                                )}

                                {/* Hover overlay */}
                                <div className="hashtag-post-overlay">
                                    <div className="hashtag-post-overlay-stats">
                                        <span>❤️ {(post.likes || []).length.toLocaleString()}</span>
                                        <span>💬 {(post.comments || []).length.toLocaleString()}</span>
                                    </div>
                                    <div className="hashtag-post-overlay-user">
                                        {post.userAvatar && (
                                            <img src={post.userAvatar} alt={post.username}
                                                className="hashtag-post-avatar" />
                                        )}
                                        <span>@{post.username}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="hashtag-load-more">
                            <button
                                className="hashtag-load-more-btn"
                                onClick={loadMore}
                                disabled={loading}
                                id="hashtag-load-more-btn"
                            >
                                {loading ? t('common.loading') : t('feed.loadMore')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default HashtagPage;
