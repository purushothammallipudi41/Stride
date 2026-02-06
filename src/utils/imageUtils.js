import config from '../config';

export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) {
        return path;
    }
    if (path.startsWith('/uploads')) {
        return `${config.API_URL}${path}`;
    }
    return path;
};
