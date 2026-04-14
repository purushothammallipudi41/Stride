import './SkeletonPost.css';

const SkeletonPost = () => {
    return (
        <div className="skeleton-post">
            <div className="skeleton-header">
                <div className="skeleton-avatar skeleton-shimmer"></div>
                <div className="skeleton-user-info">
                    <div className="skeleton-line short skeleton-shimmer"></div>
                </div>
            </div>
            <div className="skeleton-media skeleton-shimmer"></div>
            <div className="skeleton-footer">
                <div className="skeleton-actions">
                    <div className="skeleton-icon skeleton-shimmer"></div>
                    <div className="skeleton-icon skeleton-shimmer"></div>
                    <div className="skeleton-icon skeleton-shimmer"></div>
                </div>
                <div className="skeleton-line medium skeleton-shimmer"></div>
                <div className="skeleton-line long skeleton-shimmer"></div>
            </div>
        </div>
    );
};

export default SkeletonPost;
