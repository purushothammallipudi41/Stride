import { useState, useEffect, useCallback, useRef } from 'react';
import Post from './Post';
import socket from '../../services/socket';
import { BASE_URL } from '../../utils/api';
import { getStoredUser } from '../../utils/storage';
import SkeletonPost from '../common/SkeletonPost';
import AdCard from './AdCard';
import './Feed.css';

const Feed = ({ type = 'foryou' }) => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadFeed = useCallback(() => {
        const user = getStoredUser();
        const userId = user._id || user.id || user.username;
        const url = type === 'following' && userId && userId !== 'guest'
            ? `${BASE_URL}/api/feed/following?userId=${userId}`
            : `${BASE_URL}/api/feed`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setPosts(Array.isArray(data) ? data : []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch feed:", err);
                setIsLoading(false);
            });
    }, [type]);

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
    }, [loadFeed]);



    if (isLoading) {
        return (
            <div className="feed-container">
                <SkeletonPost />
                <SkeletonPost />
                <SkeletonPost />
            </div>
        );
    }

    const user = getStoredUser();

    return (
        <div className="feed-container">
            {posts.map((post, index) => (
                <div key={post._id || post.id}>
                    <MonetizedPost post={post} user={user} />
                    {(index + 1) % 5 === 0 && <AdCard />}
                </div>
            ))}
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
                        <p>Support {post.username} to unlock this rhythmic rhythm.</p>
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
