// Local machine IP for Android debugging
const LOCAL_MACHINE_IP = '192.168.1.2';

const isDev = import.meta.env.DEV;
const isNative = window.location.protocol === 'capacitor:' || /android|iphone|ipad|ipod/i.test(navigator.userAgent);

const config = {
    API_URL: isDev ? 'http://localhost:3001' : 'https://stride-backend-7ax9.onrender.com'
};

export default config;
