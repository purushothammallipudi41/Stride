import Post from './Post';

const Feed = () => {
    const posts = [
        {
            id: 1,
            username: "alex_beats",
            timestamp: "2h ago",
            type: "image",
            contentUrl: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2600&auto=format&fit=crop",
            caption: "Studio vibes today. Working on something new! 🎹 #producer #music",
            likes: 124,
            comments: 18
        },
        {
            id: 2,
            username: "city_scapes",
            timestamp: "5h ago",
            type: "image",
            contentUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2000&auto=format&fit=crop",
            caption: "Neon lights and late nights.",
            likes: 89,
            comments: 5
        },
        {
            id: 3,
            username: "indie_folk",
            timestamp: "1d ago",
            type: "image",
            contentUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2000&auto=format&fit=crop",
            caption: "Practicing for the upcoming gig. Can't wait on Friday!",
            likes: 342,
            comments: 42
        }
    ];

    return (
        <div className="feed-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 0' }}>
            {posts.map(post => (
                <Post key={post.id} post={post} />
            ))}
        </div>
    );
};

export default Feed;
