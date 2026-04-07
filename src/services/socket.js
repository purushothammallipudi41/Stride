import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/api';

const socket = io(SOCKET_URL, {
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 20000
});

socket.on('connect', () => {
    console.log('Connected to backend socket:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

socket.on('reconnect_attempt', (attempt) => {
    console.log(`Socket reconnect attempt #${attempt}`);
});

if (typeof window !== 'undefined') {
    window.socket = socket;
}

export default socket;
