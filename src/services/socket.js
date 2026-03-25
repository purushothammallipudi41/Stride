import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
const socket = io(SOCKET_URL);

socket.on('connect', () => {
    console.log('Connected to backend socket:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

export default socket;
