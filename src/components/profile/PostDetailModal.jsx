import { createPortal } from 'react-dom';
import Post from '../feed/Post';
import { X } from 'lucide-react';
import './PostDetailModal.css';

const PostDetailModal = ({ post, onClose }) => {
    return createPortal(
        <div className="post-detail-overlay" onClick={onClose}>
            <div className="post-detail-content glass-card" onClick={e => e.stopPropagation()}>
                <button className="close-detail-btn" onClick={onClose}><X size={24} /></button>
                <Post post={post} />
            </div>
        </div>,
        document.body
    );
};

export default PostDetailModal;
