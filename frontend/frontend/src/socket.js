import { io } from 'socket.io-client';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const socketURL = apiBaseURL.replace(/\/api\/?$/, '');

const socket = io(socketURL, { autoConnect: true });

export default socket;
