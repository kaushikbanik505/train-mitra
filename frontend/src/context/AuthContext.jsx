import { createContext, useContext, useState } from 'react';
import client from '../api/client';
import socket from '../socket';

const AuthContext = createContext(null);

// The socket connects once at import time, so a login/logout after that needs to force
// a fresh handshake for the server to pick up the new (or cleared) token identity.
function reconnectSocket() {
  socket.disconnect();
  socket.connect();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  function persistSession(data) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    reconnectSocket();
  }

  async function register(name, email, password) {
    const { data } = await client.post('/auth/register', { name, email, password });
    persistSession(data);
  }

  async function login(email, password) {
    const { data } = await client.post('/auth/login', { email, password });
    persistSession(data);
  }

  async function resendVerification(email) {
    const { data } = await client.post('/auth/resend-verification', { email });
    return data;
  }

  async function verifyEmail(token) {
    const { data } = await client.post('/auth/verify-email', { token });
    return data;
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    reconnectSocket();
  }

  async function updateProfile(updates) {
    const { data } = await client.patch('/users/me', updates);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, register, login, logout, updateProfile, resendVerification, verifyEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
