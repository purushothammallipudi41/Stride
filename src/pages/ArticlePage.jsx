import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Eye, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import './ArticlePage.css';

const ArticlePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetch_ = async () => {
            try {
                const res = await fetch(`${config.API_URL}/api/articles/${id}`, { headers });
                const data = await res.json();
                setArticle(data);
                setLikesCount(data.likes?.length || 0);
                setLiked(data.likes?.includes(user?.email));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch_();
    }, [id]);

    const toggleLike = async () => {
        try {
            const res = await fetch(`${config.API_URL}/api/articles/${id}/like`, { method: 'POST', headers });
            const data = await res.json();
            setLiked(data.isLiked);
            setLikesCount(data.likes);
        } catch (e) { console.error(e); }
    };

    if (loading) return (
        <div className="article-page">
            <div className="article-skeleton">
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-block" style={{ height: i === 1 ? 48 : 20, borderRadius: 8, marginBottom: 14 }} />)}
            </div>
        </div>
    );

    if (!article) return <div className="article-page"><p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Article not found.</p></div>;

    const readTime = Math.max(1, Math.ceil((article.content || '').replace(/<[^>]+>/g, '').split(' ').length / 200));

    return (
        <div className="article-page">
            <button className="article-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>

            {article.coverImage && (
                <img src={article.coverImage} alt="cover" className="article-cover" />
            )}

            <div className="article-meta-row">
                <img src={article.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${article.authorUsername}`} alt="" className="article-author-avatar" />
                <div>
                    <span className="article-author-name">{article.authorUsername}</span>
                    <div className="article-meta-secondary">
                        <Calendar size={12} /> {new Date(article.createdAt).toLocaleDateString()}
                        <Clock size={12} style={{ marginLeft: 8 }} /> {readTime} min read
                        <Eye size={12} style={{ marginLeft: 8 }} /> {article.views} views
                    </div>
                </div>
            </div>

            {article.tags?.length > 0 && (
                <div className="article-tags">
                    {article.tags.map(tag => <span key={tag} className="article-tag">#{tag}</span>)}
                </div>
            )}

            <h1 className="article-title">{article.title}</h1>

            <div className={`article-body ${article.isLocked ? 'locked-blur' : ''}`} dangerouslySetInnerHTML={{ __html: article.content }} />

            {article.isLocked && (
                <div className="article-unlock-overlay animate-in">
                    <ShieldAlert size={48} color="var(--color-primary)" />
                    <h2>Exclusive Article</h2>
                    <p>Unlock this article to continue reading.</p>
                    <div className="unlock-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'center' }}>
                        {article.unlockPrice > 0 && (
                            <button className="primary-btn" onClick={async () => {
                                try {
                                    const res = await fetch(`${config.API_URL}/api/purchase-content`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}` },
                                        body: JSON.stringify({ contentType: 'article', contentId: article._id, serverId: article.serverId })
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                        window.location.reload();
                                    } else {
                                        alert(data.error || 'Failed to unlock');
                                    }
                                } catch (err) {
                                    alert('Network error');
                                }
                            }}>
                                Unlock for {article.unlockPrice} 🪙
                            </button>
                        )}
                        {article.requiredTier > 0 && article.serverId && (
                            <button className="secondary-btn" onClick={() => navigate(`/servers/${article.serverId}`)}>
                                View Server Tier
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!article.isLocked && (
                <div className="article-footer">
                    <button className={`article-like-btn ${liked ? 'liked' : ''}`} onClick={toggleLike}>
                        <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                        {likesCount} {liked ? 'Liked' : 'Like'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ArticlePage;
