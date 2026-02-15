import { createContext, useState, useContext, useEffect } from 'react';
import config from '../config';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';

const ContentContext = createContext();

export const useContent = () => useContext(ContentContext);

export const ContentProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);
    const [stories, setStories] = useState([]);
    const { addNotification } = useNotifications();
    const { user } = useAuth();

    const fetchPosts = async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();
            if (user) queryParams.append('viewerId', user.id || user._id);

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) queryParams.append(key, value);
            });

            const res = await fetch(`${config.API_URL}/api/posts?${queryParams.toString()}`);
            if (res.ok) {
                const data = await res.json();
                // If it's a specialized fetch (profile/reels), we don't want to overwrite the main feed
                // unless we are purposefuly refreshing it.
                if (!params.type && !params.username) {
                    setPosts(data);
                }
                return data;
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
            return [];
        }
    };

    const fetchStories = async () => {
        try {
            const query = user ? `?viewerId=${user.id || user._id}` : '';
            const res = await fetch(`${config.API_URL}/api/stories${query}`);
            if (res.ok) setStories(await res.json());
        } catch (error) {
            console.error('Failed to fetch stories:', error);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchStories();
    }, [user?.id, user?._id]);

    const addPost = async (postData) => {
        try {
            const res = await fetch(`${config.API_URL}/api/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            if (res.ok) {
                const savedPost = await res.json();
                setPosts(prev => [savedPost, ...prev]);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to add post:', error);
            // Fallback for offline/development if needed, but we want real sync
            return false;
        }
    };

    const addStory = async (storyData) => {
        try {
            const res = await fetch(`${config.API_URL}/api/stories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(storyData)
            });

            if (res.ok) {
                await fetchStories(); // Refresh stories rail
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to add story:', error);
            return false;
        }
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
                const matchedPost = posts.find(p => (p._id || p.id) === postId);

                setPosts(prev => prev.map(post =>
                    (post._id || post.id) === postId ? { ...post, likes } : post
                ));

                // Notification Logic: Only alert if NOT liking own post
                if (likes.includes(userEmail) && matchedPost && (matchedPost.userId !== userEmail && matchedPost.userEmail !== userEmail)) {
                    addNotification({
                        type: 'like',
                        user: { name: user.name || user.username, avatar: user.avatar, email: user.email },
                        content: 'liked your post',
                        targetId: postId,
                        targetUserEmail: matchedPost.userId || matchedPost.userEmail
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
                        username: user.username,
                        userAvatar: user.avatar,
                        userId: user.email
                    }
                })
            });
            if (res.ok) {
                const newComment = await res.json();
                const matchedPost = posts.find(p => (p._id || p.id) === postId);

                setPosts(prev => prev.map(post => {
                    if ((post._id || post.id) === postId) {
                        return { ...post, comments: [...(post.comments || []), newComment] };
                    }
                    return post;
                }));

                // Notification Logic
                if (matchedPost && (matchedPost.userId !== user.email && matchedPost.userEmail !== user.email)) {
                    addNotification({
                        type: 'comment',
                        user: { name: user.name || user.username, avatar: user.avatar, email: user.email },
                        content: 'commented on your post',
                        targetId: postId,
                        targetUserEmail: matchedPost.userId || matchedPost.userEmail
                    });
                }
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

    const deletePost = async (postId) => {
        try {
            const res = await fetch(`${config.API_URL}/api/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.email })
            });
            if (res.ok) {
                console.log('Post deleted successfully, updating state for ID:', postId);
                setPosts(prev => prev.filter(p => String(p._id || p.id) !== String(postId)));
                return true;
            }
            console.warn('Deletion failed on server for ID:', postId);
            return false;
        } catch (error) {
            console.error('Failed to delete post:', error);
            return false;
        }
    };

    const [savedPosts, setSavedPosts] = useState([]);

    // Load saved posts from local storage on init
    useEffect(() => {
        const saved = localStorage.getItem('vibestream_saved_posts');
        if (saved) setSavedPosts(JSON.parse(saved));
    }, []);

    const toggleSavePost = (post) => {
        setSavedPosts(prev => {
            const isSaved = prev.some(p => (p._id || p.id) === (post._id || post.id));
            let newSaved;
            if (isSaved) {
                newSaved = prev.filter(p => (p._id || p.id) !== (post._id || post.id));
            } else {
                newSaved = [...prev, post];
            }
            localStorage.setItem('vibestream_saved_posts', JSON.stringify(newSaved));
            return newSaved;
        });
    };

    return (
        <ContentContext.Provider value={{
            posts,
            stories,
            savedPosts,
            addPost,
            addStory,
            toggleLike,
            addComment,
            likeComment,
            replyToComment,
            fetchPosts,
            fetchStories,
            deletePost,
            toggleSavePost
        }}>
            {children}
        </ContentContext.Provider>
    );
};
