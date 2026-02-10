import { createContext, useState, useContext, useEffect } from 'react';
import config from '../config';
import { useNotifications } from './NotificationContext';

const ContentContext = createContext();

export const useContent = () => useContext(ContentContext);

export const ContentProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);
    const [stories, setStories] = useState([]);
    const { addNotification } = useNotifications();

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${config.API_URL}/api/posts`);
            if (res.ok) setPosts(await res.json());
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        }
    };

    const fetchStories = async () => {
        try {
            const res = await fetch(`${config.API_URL}/api/stories`);
            if (res.ok) setStories(await res.json());
        } catch (error) {
            console.error('Failed to fetch stories:', error);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchStories();
    }, []);

    const addPost = (post) => {
        const newPost = {
            id: Date.now(),
            likes: [],
            comments: [],
            ...post,
            timestamp: new Date().toISOString()
        };
        setPosts([newPost, ...posts]);
    };

    const toggleLike = async (postId, userEmail) => {
        try {
            const res = await fetch(`${config.API_URL}/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail })
            });
            if (res.ok) {
                const { likes } = await res.json();
                setPosts(prev => prev.map(post =>
                    (post._id || post.id) === postId ? { ...post, likes } : post
                ));

                if (likes.includes(userEmail)) {
                    addNotification({
                        type: 'like',
                        user: { name: userEmail.split('@')[0], avatar: '' },
                        content: 'liked your post'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to toggle like:', error);
        }
    };

    const addComment = async (postId, commentText) => {
        try {
            const res = await fetch(`${config.API_URL}/api/posts/${postId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comment: {
                        text: commentText,
                        user: 'purushotham', // Default for now
                        avatar: ''
                    }
                })
            });
            if (res.ok) {
                const newComment = await res.json();
                setPosts(prev => prev.map(post => {
                    if ((post._id || post.id) === postId) {
                        return { ...post, comments: [...(post.comments || []), newComment] };
                    }
                    return post;
                }));
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const likeComment = (postId, commentId) => {
        const updateLikes = (comments) => comments.map(c => {
            if (c.id === commentId) {
                const isLiked = !c.isLiked;
                return { ...c, isLiked, likeCount: (c.likeCount || 0) + (isLiked ? 1 : -1) };
            }
            if (c.replies) return { ...c, replies: updateLikes(c.replies) };
            return c;
        });

        setPosts(posts.map(post => {
            if ((post._id || post.id) === postId) {
                return { ...post, comments: updateLikes(post.comments) };
            }
            return post;
        }));
    };

    const replyToComment = (postId, parentId, text) => {
        const addReply = (comments) => comments.map(c => {
            if (c.id === parentId) {
                return {
                    ...c,
                    replies: [...(c.replies || []), {
                        id: Date.now(),
                        text,
                        user: 'You',
                        timestamp: new Date().toISOString(),
                        replies: []
                    }]
                };
            }
            if (c.replies) return { ...c, replies: addReply(c.replies) };
            return c;
        });

        setPosts(posts.map(post => {
            if ((post._id || post.id) === postId) {
                return { ...post, comments: addReply(post.comments) };
            }
            return post;
        }));
    };

    return (
        <ContentContext.Provider value={{
            posts,
            stories,
            addPost,
            toggleLike,
            addComment,
            likeComment,
            replyToComment,
            fetchStories
        }}>
            {children}
        </ContentContext.Provider>
    );
};
