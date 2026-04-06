import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/api';

const socket = io(SOCKET_URL);

socket.on('connect', () => {
    console.log('Connected to backend socket:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

if (typeof window !== 'undefined') {
    window.socket = socket;
}

export default socket;
