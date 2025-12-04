import React, { createContext, useState, useContext, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined); 

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 🛑 UPDATED LOGIN: Now fetches from Real API
    const login = async (email: string, password: string) => {
        setIsLoading(true); 
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success! The backend returns the sanitized user object
                setUser(data);
                setIsLoading(false);
            } else {
                // Failure (401 Unauthorized, etc.)
                setError(data.error || 'Login failed');
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Network Error:", err);
            setError('Unable to connect to the server.');
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setError(null);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
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