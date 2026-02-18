import config from '../config';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
const DEFAULT_MEDIA = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333'%3E%3Crect width='24' height='24' rx='2' ry='2' /%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' fill='%23555'/%3E%3C/svg%3E";
const DEFAULT_TRACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238257E5'%3E%3Cpath d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'/%3E%3C/svg%3E";

export const getImageUrl = (path, type = 'user') => {
    if (!path) {
        if (type === 'user') return DEFAULT_AVATAR;
        if (type === 'track') return DEFAULT_TRACK;
        return DEFAULT_MEDIA;
    }

    // Handle relative paths (e.g. logo.png in public folder)
    if (path.includes('.') && !path.includes('/') && !path.includes('http')) {
        return `/${path}`;
    }

    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;

    const baseUrl = config.API_URL || '';

    // If it already starts with /uploads, don't prepend it again
    if (path.startsWith('/uploads')) {
        return `${baseUrl}${path}`;
    }

    const cleanPath = path.startsWith('/') ? path : `/uploads/${path}`;
    return `${baseUrl}${cleanPath}`;
};
