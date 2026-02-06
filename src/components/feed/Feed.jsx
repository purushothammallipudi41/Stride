import { useContent } from '../../context/ContentContext';
import Post from './Post';

const Feed = () => {
    const { posts } = useContent();

    return (
        <div className="post-list">
            {posts.map(post => (
                <Post key={post.id} post={post} />
            ))}
        </div>
    );
};

export default Feed;
