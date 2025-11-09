// types.ts

export type UserRole = 'landlord' | 'tenant' | null;

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
}