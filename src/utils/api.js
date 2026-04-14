const isDev = import.meta.env.DEV;
const isE2E = typeof window !== 'undefined' && window.localStorage.getItem('isE2E') === 'true';

export const BASE_URL = import.meta.env.VITE_API_URL || (isDev || isE2E ? 'http://127.0.0.1:3001' : 'https://stride-backend-iicg.onrender.com');
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isDev ? 'http://127.0.0.1:3001' : BASE_URL);

export const getApiUrl = (path) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

export default {
    BASE_URL,
    SOCKET_URL,
    getApiUrl
};
