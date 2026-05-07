import { useState, useEffect, useCallback, useRef } from 'react';
import Post from './Post';
import socket from '../../services/socket';
import { BASE_URL } from '../../utils/api';
import { getStoredUser } from '../../utils/storage';
import SkeletonPost from '../common/SkeletonPost';
import AdCard from './AdCard';
import './Feed.css';

const Feed = ({ type: initialType = 'foryou' }) => {
    const [activeTab, setActiveTab] = useState(initialType);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadFeed = useCallback(() => {
        const user = getStoredUser();
        const username = user?.username;
        const userId = user?._id || user?.id;
        
        // Build the discovery frequency URL
        let url = `${BASE_URL}/api/feed`;
        const queryParams = new URLSearchParams();

        if (activeTab === 'following' && username) {
            url = `${BASE_URL}/api/feed/following`;
            queryParams.append('username', username);
        } else if (activeTab === 'foryou') {
            queryParams.append('type', 'personalized');
            if (username) queryParams.append('username', username);
        }

        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        setIsLoading(true);
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const validPosts = Array.isArray(data) ? data.filter(p => p.imageUrl || p.contentUrl || p.url) : [];
                setPosts(validPosts);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch feed:", err);
                setIsLoading(false);
            });
    }, [activeTab]);

    useEffect(() => {
        loadFeed();
        
        const handleUpdate = (event) => {
            console.log(`[Feed/Socket] Received ${event.type} update:`, event.data);
            if (event.type === 'post' && event.data) {
                // Instant inject new post at the top
                setPosts(prev => {
                    const exists = prev.find(p => (p._id || p.id) === (event.data._id || event.data.id));
                    if (exists) return prev;
                    return [event.data, ...prev];
                });
            } else if (event.type === 'post') {
                // Fallback for events without data payload
                loadFeed();
            }
        };
        
        socket.on('content_updated', handleUpdate);
        return () => socket.off('content_updated', handleUpdate);
    }, [loadFeed, activeTab]);

    const user = getStoredUser();

    return (
        <div className="feed-container">
            <div className="feed-tabs-v2 glass-panel">
                <button 
                    className={`feed-tab-btn ${activeTab === 'foryou' ? 'active' : ''}`}
                    onClick={() => setActiveTab('foryou')}
                >
                    For You
                    <div className="tab-indicator"></div>
                </button>
                <button 
                    className={`feed-tab-btn ${activeTab === 'following' ? 'active' : ''}`}
                    onClick={() => setActiveTab('following')}
                >
                    Following
                    <div className="tab-indicator"></div>
                </button>
            </div>

            {isLoading ? (
                <div className="feed-loading-state">
                    <SkeletonPost />
                    <SkeletonPost />
                </div>
            ) : (
                <div className="posts-scroll-area">
                    {posts.map((post, index) => (
                        <div key={post._id || post.id}>
                            <MonetizedPost post={post} user={user} />
                            {(index + 1) % 5 === 0 && <AdCard />}
                        </div>
                    ))}
                    
                    {posts.length === 0 && (
                        <div className="empty-feed-v2">
                            <i className="ri-pulse-line"></i>
                            <p>No frequencies found in this channel.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// MonetizedPost Wrapper for Impression Tracking
const MonetizedPost = ({ post, user }) => {
    const postRef = useRef(null);
    const [hasCounted, setHasCounted] = useState(false);

    useEffect(() => {
        if (hasCounted || !post._id || !user?.username) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                // Record Unique Impression
                fetch(`${BASE_URL}/api/monetization/impression/${post._id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user.username })
                })
                .then(res => res.json())
                .then(() => setHasCounted(true))
                .catch(err => console.error("Impression error:", err));

                observer.unobserve(postRef.current);
            }
        }, { threshold: 0.5 }); // Require 50% visibility

        if (postRef.current) observer.observe(postRef.current);
        return () => {
            if (postRef.current) observer.unobserve(postRef.current);
        };
    }, [post._id, user?.username, hasCounted]);

    const isMemberOnly = post.isMemberOnly || post.isPremium;
    const isOwner = post.username === user?.username;
    
    // Check for access? Simple placeholder for now
    const hasAccess = isOwner || !isMemberOnly;

    return (
        <div ref={postRef} className="monetized-post-wrapper">
             {!hasAccess ? (
                <div className="premium-gate glass-panel">
                    <div className="gate-content">
                        <h3>Subscriber Only Content 💎</h3>
                        <p>Support {post.username} to unlock this exclusive frequency.</p>
                        <button className="unlock-btn">Subscribe to Unlock</button>
                    </div>
                </div>
            ) : (
                <Post post={post} />
            )}
        </div>
    );
};

export default Feed;
