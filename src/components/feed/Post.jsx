import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import './Post.css';

const Post = ({ post }) => {
    return (
        <article className="post-card">
            <div className="post-header">
                <div className="post-user-info">
                    <div className="avatar-placeholder" /> {/* Replace with IMG if available */}
                    <div className="user-details">
                        <span className="username">{post.username}</span>
                        <span className="timestamp">{post.timestamp}</span>
                    </div>
                </div>
                <button className="more-btn">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <div className="post-content">
                {post.type === 'image' && (
                    <div className="post-image-container">
                        <img src={post.contentUrl} alt="Post content" className="post-image" />
                    </div>
                )}
                {post.caption && <p className="post-caption">{post.caption}</p>}
            </div>

            <div className="post-actions">
                <div className="action-buttons">
                    <button className="action-btn">
                        <Heart size={24} />
                        <span className="action-count">{post.likes}</span>
                    </button>
                    <button className="action-btn">
                        <MessageCircle size={24} />
                        <span className="action-count">{post.comments}</span>
                    </button>
                    <button className="action-btn">
                        <Share2 size={24} />
                    </button>
                </div>
            </div>
        </article>
    );
};

export default Post;
