import { useState } from 'react';
import { X, Send, Hash, Type, AlignLeft } from 'lucide-react';
import { BASE_URL } from '../../utils/api';
import './CommunityBoard.css';

const ThreadCreator = ({ communityId, user, onClose, onCreated }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`${BASE_URL}/api/threads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    communityId,
                    author: user.username,
                    authorAvatar: user.avatar,
                    title,
                    content,
                    tags: tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t)
                })
            });
            const data = await res.json();
            if (data.success) {
                onCreated();
                onClose();
            }
        } catch (err) {
            console.error("Create thread failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="thread-creator-modal glass-panel animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Start Rhythmic Discussion</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="thread-form">
                    <div className="input-group-v2">
                        <label><Type size={14} /> Title</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Analyzing the drop in #phonk music"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group-v2">
                        <label><AlignLeft size={14} /> Discussion content</label>
                        <textarea 
                            placeholder="Share your deep thoughts..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group-v2">
                        <label><Hash size={14} /> Tags (comma separated)</label>
                        <input 
                            type="text" 
                            placeholder="e.g. phonk, production, bass"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="launch-thread-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Launching...' : 'Launch Discussion'} <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ThreadCreator;
