// Local machine IP for Android debugging
const LOCAL_MACHINE_IP = '192.168.1.2';

const isDev = import.meta.env.DEV;
const isNative = window.location.protocol === 'capacitor:' || /android|iphone|ipad|ipod/i.test(navigator.userAgent);

const config = {
    // Priority:
    // 1. If we are in DEV mode, use local backend
    // 2. If it's a NATIVE app in DEV mode, use the local IP fallback
    // 3. Otherwise (PROD/Build), use the Render backend
    API_URL: isDev
        ? (isNative ? `http://${LOCAL_MACHINE_IP}:3001` : `http://${window.location.hostname}:3001`)
        : 'https://stride-backend-7ax9.onrender.com'
};

export default config;
