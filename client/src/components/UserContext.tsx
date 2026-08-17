// client/src/components/UserContext.tsx
import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types/types';
import { io, Socket } from 'socket.io-client';

interface ExtendedAuthContextType extends AuthContextType {
    globalSocket: Socket | null;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('dormfixUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [globalSocket, setGlobalSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (user) {
            localStorage.setItem('dormfixUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('dormfixUser');
        }
    }, [user]);

    useEffect(() => {
        if (user?.id) {
            const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
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
    }, [user?.id]);

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