import { useNavigate } from 'react-router-dom';

/**
 * Renders text with #hashtags turned into clickable links.
 * Usage: <HashtagText text={post.text} />
 */
const HashtagText = ({ text, className }) => {
    const navigate = useNavigate();

    if (!text) return null;

    // Split on #word boundaries
    const parts = text.split(/(#[\w]+)/g);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (/^#[\w]+$/.test(part)) {
                    return (
                        <span
                            key={i}
                            className="hashtag-chip"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/explore?tag=${encodeURIComponent(part.slice(1))}`);
                            }}
                            style={{
                                color: 'var(--accent-primary, #a78bfa)',
                                cursor: 'pointer',
                                fontWeight: 600,
                            }}
                        >
                            {part}
                        </span>
                    );
                }
                return part;
            })}
        </span>
    );
};

export default HashtagText;
