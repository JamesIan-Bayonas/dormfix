// types.ts

export type UserRole = 'landlord' | 'tenant';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password: string; // NEW: Added password to the User type
}

export interface AuthContextType {
  user: User | null;
  // NEW: Updated login function to accept password
  login: (email: string, password: string, role: UserRole) => void;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}