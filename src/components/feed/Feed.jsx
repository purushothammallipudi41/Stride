import { useState, useEffect, useCallback } from 'react';
import Post from './Post';
import socket from '../../services/socket';

const Feed = ({ type = 'foryou' }) => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadFeed = useCallback(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user._id || user.id || user.username;
        const url = type === 'following' && userId && userId !== 'guest'
            ? `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'}/api/feed/following?userId=${userId}`
            : `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'}/api/feed`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setPosts(data);
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
            if (event.type === 'post') {
                loadFeed();
            }
        };
        
        socket.on('content_updated', handleUpdate);
        return () => socket.off('content_updated', handleUpdate);
    }, [loadFeed]);



    if (isLoading) {
        return <div className="feed-loading">Vibing with the server...</div>;
    }

    return (
        <div className="feed-container" style={{ width: '100%', maxWidth: '700px', margin: '0 auto' }}>
            {posts.map(post => (
                <Post key={post.id} post={post} />
            ))}
        </div>
    );
};

export default Feed;
