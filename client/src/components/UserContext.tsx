// client/src/components/UserContext.tsx
import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types/types';
import { io, Socket } from 'socket.io-client';
import { sessionExpiredEvent } from '../api/session';

interface ExtendedAuthContextType extends AuthContextType {
    globalSocket: Socket | null;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('dormfixUser');
        try { const saved = savedUser ? JSON.parse(savedUser) : null; return typeof saved?.accessToken === 'string' && /^[a-f0-9]{64}$/i.test(saved.accessToken) ? saved : null; }
        catch { return null; }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [globalSocket, setGlobalSocket] = useState<Socket | null>(null);
    useEffect(() => {
        const changed = (event: StorageEvent) => {
            if (event.storageArea !== localStorage || event.key !== 'dormfixUser') return;
            try {
                const saved = event.newValue ? JSON.parse(event.newValue) : null;
                setUser(typeof saved?.accessToken === 'string' && /^[a-f0-9]{64}$/i.test(saved.accessToken) ? saved : null);
            } catch { setUser(null); }
        };
        window.addEventListener('storage', changed);
        return () => window.removeEventListener('storage', changed);
    }, []);
    useEffect(() => {
        const expired = (event: Event) => {
            if ((event as CustomEvent<{ token: string }>).detail.token !== user?.accessToken) return;
            setUser(null); setError('Your session expired. Please sign in again.');
        };
        window.addEventListener(sessionExpiredEvent, expired);
        return () => window.removeEventListener(sessionExpiredEvent, expired);
    }, [user?.accessToken]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('dormfixUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('dormfixUser');
        }
    }, [user]);

    useEffect(() => {
        if (user?.id) {
            const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { auth: { token: user.accessToken } });
            setGlobalSocket(socket);

            socket.emit('register_user', user.id);

            return () => {
                socket.disconnect();
            };
        } else {
            if (globalSocket) {
                globalSocket.disconnect();
                setGlobalSocket(null);
            }
        }
    }, [user?.id, user?.accessToken]);

    const login = async (email: string, password: string) => {
        setIsLoading(true); 
        setError(null);
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('dormfixUser', JSON.stringify(data));
                setUser(data);
                setIsLoading(false);
            } else {
                setError(data.error || 'Login failed');
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Network Error:", err);
            setError('Unable to connect to the server.');
            setIsLoading(false);
        }
    };

    const updateUser = (updatedData: Partial<User>) => {
        setUser((prev) => {
            if (!prev) return null;
            const updated = { ...prev, ...updatedData };
            localStorage.setItem('dormfixUser', JSON.stringify(updated));
            return updated;
        });
    };

    const logout = () => {
        if (user?.accessToken) {
            void fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/logout`, {
                method: 'POST', headers: { Authorization: `Bearer ${user.accessToken}` },
            }).catch(() => { /* Local sign out still clears the session on this device. */ });
        }
        if (globalSocket) {
            globalSocket.disconnect();
        }
        setUser(null);
        setError(null);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading, error, globalSocket }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
