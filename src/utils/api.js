import { Capacitor } from '@capacitor/core';

const isDev = import.meta.env.DEV;
const isE2E = typeof window !== 'undefined' && window.localStorage.getItem('isE2E') === 'true';
const isNative = Capacitor.isNativePlatform();

// FORCE Production Backend for Native Mobile to prevent '127.0.0.1' connectivity failures on device
const PROD_URL = 'https://vyx-backend-519726312796.us-east1.run.app';
export const BASE_URL = import.meta.env.VITE_API_URL || ((isDev || isE2E) && !isNative ? 'http://127.0.0.1:3001' : PROD_URL);
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isDev && !isNative ? 'http://127.0.0.1:3001' : BASE_URL);

export const getApiUrl = (path) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

export default {
    BASE_URL,
    SOCKET_URL,
    getApiUrl
};
