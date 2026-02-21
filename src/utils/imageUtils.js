import config from '../config';

export const getImageUrl = (path, type = 'post') => {
    if (!path) return '';

    // If it's already a full URL or blob, return as is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
        return path;
    }

    // Special case for dicebear or other external generators that might be passed without protocol
    if (path.includes('api.dicebear.com')) {
        return path.startsWith('//') ? `https:${path}` : `https://${path}`;
    }

    // Check if it looks like an absolute path but missing protocol (e.g. from Audius or Cloudinary)
    if (path.includes('.') && (path.includes('/') || path.length > 20) && !path.startsWith('/')) {
        // If it has a domain-like structure, assume it's an external URL
        return `https://${path}`;
    }

    // If it's a relative path, prepend backend URL and static uploads folder
    // Ensure we don't double-slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${config.API_URL}/uploads/${cleanPath}`;
};
