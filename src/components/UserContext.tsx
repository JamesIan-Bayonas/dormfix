// src/components/UserContext.tsx
import React, { createContext, useState, useContext, type ReactNode } from 'react';
import type { User, UserRole, AuthContextType } from '../types/types.ts';

const AuthContext = createContext<AuthContextType | undefined>(undefined); 

// Mock user data for demonstration purposes
const MOCK_USERS: Record<string, User & { password: string }> = {
    'landlord@dormfix.com': { id: 'L1', name: 'Admin Dela Cruz', role: 'landlord', email: 'landlord@dormfix.com', password: 'adminpass' },
    'tenant@dormfix.com': { id: 'T101', name: 'Maria Santos', role: 'tenant', email: 'tenant@dormfix.com', password: 'tenantpass' },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Signature updated to accept password
    const login = (email: string, password: string, role: UserRole) => {
        setIsLoading(true); 
        setError(null);

        // Simulate network delay
        setTimeout(() => {
            const mockUser = MOCK_USERS[email as keyof typeof MOCK_USERS];

            if (mockUser && mockUser.role === role && mockUser.password === password) {
                // Success
                setUser(mockUser);
                setIsLoading(false);
            } else {
                // Failure
                setError('Login failed: Invalid credentials or role selected.');
                setIsLoading(false);
            }
        }, 800);
    };

    const logout = () => {
        setUser(null);
        setError(null);
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