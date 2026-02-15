import { io } from 'socket.io-client';

export const initSocket = () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: Infinity,
        timeout: 20000,
        transports: ['websocket', 'polling'],
    };
    return io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', options);
};
