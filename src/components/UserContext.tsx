// UserContext.tsx
import React, { createContext, useState, useContext, type ReactNode } from 'react'; // import ReactNode type
import type { User, UserRole, AuthContextType } from '../types/types.ts'; //type is a reserved word in TS
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for the prototype (replace with API calls in a real application)
const MOCK_USERS : Record<string, User>= {
  'landlord@dormfix.com': { id: 'L1', name: 'Admin Dela Cruz', role: 'landlord', email: 'landlord@dormfix.com' },
  'tenant@dormfix.com': { id: 'T101', name: 'Maria Santos', role: 'tenant', email: 'tenant@dormfix.com' },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, role: UserRole) => {
    // In a real app, you would verify password here and fetch user data from a server.
    const mockUser = MOCK_USERS[email as keyof typeof MOCK_USERS];
    
    if (mockUser && mockUser.role === role) {
      setUser(mockUser);
    } else {
      alert('Login failed: Invalid credentials or role selected.');
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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