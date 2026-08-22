import { io } from 'socket.io-client';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const socketURL = apiBaseURL.replace(/\/api\/?$/, '');

// `auth` as a function is re-invoked on every (re)connect attempt, so it always sends
// whatever token is currently in localStorage rather than one captured at import time.
const socket = io(socketURL, {
  autoConnect: true,
  auth: (cb) => cb({ token: localStorage.getItem('accessToken') }),
});

export default socket;
