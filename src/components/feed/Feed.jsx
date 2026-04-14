import { useState, useEffect, useCallback } from 'react';
import Post from './Post';
import socket from '../../services/socket';
import { BASE_URL } from '../../utils/api';
import { getStoredUser } from '../../utils/storage';
import SkeletonPost from '../common/SkeletonPost';
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

    return (
        <div className="feed-container">
            {posts.map(post => (
                <Post key={post._id || post.id} post={post} />
            ))}
        </div>
    );
};

export default Feed;
