import { useState, useEffect, memo } from 'react';
import { useContent } from '../../context/ContentContext';
import Post from './Post';
import SponsoredPost from './SponsoredPost';
import config from '../../config';

const Feed = memo(() => {
    const { posts } = useContent();
    const [ads, setAds] = useState([]);

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
            {feedItems.map((item, index) => (
                item.type === 'post' ? (
                    <Post key={`post-${item.data._id || item.data.id}-${index}`} post={item.data} />
                ) : (
                    <SponsoredPost key={`ad-${item.data._id}-${index}`} ad={item.data} />
                )
            ))}
        </div>
    );
});

export default Feed;
