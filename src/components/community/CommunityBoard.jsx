import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Clock, MessageCircle, Heart, ChevronLeft } from 'lucide-react';
import Avatar from '../common/Avatar';
import { BASE_URL } from '../../utils/api';
import ThreadCreator from './ThreadCreator';
import ThreadDetail from './ThreadDetail';
import './CommunityBoard.css';

const CommunityBoard = ({ communityId, user, isMember }) => {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeThread, setActiveThread] = useState(null);
    const [showCreator, setShowCreator] = useState(false);

    const fetchThreads = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/communities/${communityId}/threads`);
            const data = await res.json();
            if (data.success) {
                setThreads(data.threads);
            }
        } catch (err) {
            console.error("Fetch threads failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThreads();
    }, [communityId]);

    if (activeThread) {
        return (
            <ThreadDetail 
                threadId={activeThread._id} 
                user={user} 
                onBack={() => { setActiveThread(null); fetchThreads(); }} 
            />
        );
    }

    return (
        <div className="community-board-container animate-fade-in">
            <div className="board-header">
                <div className="board-title-group">
                    <h2>Community Boards</h2>
                    <p>Persistent discussions and frequencyic topics</p>
                </div>
                {isMember && (
                    <button className="create-thread-btn" onClick={() => setShowCreator(true)}>
                        <Plus size={18} /> New Thread
                    </button>
                )}
            </div>

            <div className="threads-list">
                {threads.map(thread => (
                    <div key={thread._id} className="thread-card-v2 glass-panel" onClick={() => setActiveThread(thread)}>
                        <div className="thread-vibe-tag">#DISCUSSION</div>
                        <div className="thread-main">
                            <h3 className="thread-title">{thread.title}</h3>
                            <p className="thread-snippet">{thread.content.substring(0, 120)}{thread.content.length > 120 ? '...' : ''}</p>
                        </div>
                        <div className="thread-footer-v2">
                            <div className="thread-author-v2">
                                <Avatar src={thread.authorAvatar} size={20} />
                                <span>{thread.author}</span>
                            </div>
                            <div className="thread-stats-v2">
                                <div className="stat-item">
                                    <MessageCircle size={14} />
                                    <span>{thread.replies?.length || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <Heart size={14} />
                                    <span>{thread.likes || 0}</span>
                                </div>
                                <div className="stat-item time">
                                    <Clock size={14} />
                                    <span>{new Date(thread.lastActive).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {threads.length === 0 && !loading && (
                    <div className="empty-board">
                        <MessageSquare size={48} opacity={0.2} />
                        <p>No discussions yet. Start the frequency!</p>
                    </div>
                )}
            </div>

            {showCreator && (
                <ThreadCreator 
                    communityId={communityId} 
                    user={user} 
                    onClose={() => setShowCreator(false)} 
                    onCreated={fetchThreads}
                />
            )}
        </div>
    );
};

export default CommunityBoard;
