import { useState, useEffect, memo, useRef, useCallback } from 'react';
import { useContent } from '../../context/ContentContext';

import Post from './Post';
import SponsoredPost from './SponsoredPost';
import AIDigest from './AIDigest';
import config from '../../config';
import './Feed.css';


const Feed = memo(() => {
    const { posts, fetchPosts, hasMore, loadingPosts } = useContent();
    const [ads, setAds] = useState([]);
    const observer = useRef();


    useEffect(() => {
        const fetchAds = async () => {
            try {
                const res = await fetch(`${config.API_URL}/api/ads`);
                if (res.ok) {
                    const data = await res.json();
                    setAds(data);
                }
            } catch (err) {
                console.error('Failed to fetch ads for feed:', err);
            }
        };
        fetchAds();
    }, []);

    // Infinite Scroll Logic
    const lastPostElementRef = useCallback(node => {
        if (loadingPosts) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchPosts({
                    append: true,
                    skip: posts.length,
                    limit: 10
                });
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingPosts, hasMore, fetchPosts, posts.length]);

    // Interleave ads into posts every 5 items
    const feedItems = [];
    let adIndex = 0;

    posts.forEach((post, index) => {
        feedItems.push({ type: 'post', data: post });

        // Inject ad every 5 posts if ads are available
        if ((index + 1) % 5 === 0 && ads.length > 0) {
            const ad = ads[adIndex % ads.length];
            feedItems.push({ type: 'ad', data: ad });
            adIndex++;
        }
    });


    return (
        <div className="post-list">
            <AIDigest />
            {feedItems.map((item, index) => {
                const isLastItem = index === feedItems.length - 1;
                if (item.type === 'post') {
                    return (
                        <div key={`post-${item.data._id || item.data.id}-${index}`} ref={isLastItem ? lastPostElementRef : null}>
                            <Post post={item.data} />
                        </div>
                    );
                } else {
                    return (
                        <div key={`ad-${item.data._id}-${index}`} ref={isLastItem ? lastPostElementRef : null}>
                            <SponsoredPost ad={item.data} />
                        </div>
                    );
                }
            })}

            {loadingPosts && (
                <div className="feed-loading-spinner">
                    <div className="spinner"></div>
                    <span>Loading more vibes...</span>
                </div>
            )}

            {!hasMore && posts.length > 0 && (
                <div className="feed-end-message">
                    <span>You've reached the end of the vibe. Follow more people to keep striding!</span>
                </div>
            )}
        </div>

    );
});

export default Feed;
