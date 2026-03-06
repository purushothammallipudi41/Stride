import { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import './BlurImage.css';

const BlurImage = ({ src, alt, className, type = 'post' }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const blurUrl = getImageUrl(src, 'blur');
    const mainUrl = getImageUrl(src, type);

    return (
        <div className={`blur-image-wrapper ${isLoaded ? 'loaded' : 'loading'}`}>
            <img
                src={blurUrl}
                alt=""
                className={`blur-placeholder ${className}`}
                aria-hidden="true"
            />
            <img
                src={mainUrl}
                alt={alt}
                className={`main-image ${className}`}
                onLoad={() => setIsLoaded(true)}
                loading="lazy"
            />
        </div>
    );
};

export default BlurImage;
