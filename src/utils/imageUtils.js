import config from '../config';

export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('https') || path.startsWith('data:')) {
        return path;
    }
    if (path.startsWith('/uploads')) {
        return `${config.API_URL}${path}`;
    }
    // Fix: Ensure local assets (like logo.png) have a leading slash so they load from root, not relative to current route
    if (!path.startsWith('/') && !path.startsWith('http') && !path.startsWith('data:')) {
        return `/${path}`;
    }
    return path;
};
