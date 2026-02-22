import config from '../config';

export const getImageUrl = (path, type = 'post') => {
    if (!path) return '';

    // If the path is just a typical username (no dots, slashes) OR is a legacy broken icon like 'logo.png', default to Dicebear SVG
    // This catches users who never uploaded an avatar, preventing broken 404 images
    if (type === 'user' && (!path.includes('/') || path === 'logo.png') && !path.startsWith('http')) {
        if (path === 'logo.png') return '/logo.png';
        // Strip .png or similar extensions if they accidentally got saved in db as usernames
        const cleanSeed = path.split('.')[0];
        return `https://api.dicebear.com/9.x/avataaars/svg?seed=${cleanSeed}`;
    }

    // Identify Cloudinary URLs
    const isCloudinary = path.includes('res.cloudinary.com');

    // Helper function to inject Cloudinary transformations
    const optimizeCloudinaryUrl = (url, assetType) => {
        if (!isCloudinary) return url;

        // Split the URL at the 'upload/' segment
        const parts = url.split('upload/');
        if (parts.length !== 2) return url;

        let transforms = 'q_auto,f_auto'; // Base compression: Auto quality, WebP format

        if (assetType === 'user') {
            // Avatars: 150x150 square crop, aggressively compressed
            transforms = 'w_150,h_150,c_fill,q_auto,f_auto';
        } else if (assetType === 'post') {
            // Feed images: Max width 800, keep aspect ratio
            transforms = 'w_800,c_limit,q_auto,f_auto';
        } else if (assetType === 'reel') {
            // Video/Reels: Auto format
            transforms = 'q_auto,f_auto';
        }

        // Inject transforms right after 'upload/'
        return `${parts[0]}upload/${transforms}/${parts[1]}`;
    };

    // If it's already a full URL or blob, return as is (but optimized if Cloudinary)
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
        return optimizeCloudinaryUrl(path, type);
    }

    // Special case for dicebear or other external generators that might be passed without protocol
    if (path.includes('api.dicebear.com')) {
        return path.startsWith('//') ? `https:${path}` : `https://${path}`;
    }

    // Check if it looks like an absolute path but missing protocol (e.g. from Audius or Cloudinary)
    if (path.includes('.') && (path.includes('/') || path.length > 20) && !path.startsWith('/')) {
        // If it has a domain-like structure, assume it's an external URL
        const fullExtUrl = `https://${path}`;
        return optimizeCloudinaryUrl(fullExtUrl, type);
    }

    // If it's a relative path, prepend backend URL and static uploads folder
    // Ensure we don't double-slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${config.API_URL}/uploads/${cleanPath}`;
};
