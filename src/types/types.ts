// types.ts

export type UserRole = 'landlord' | 'tenant' | null;

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface AuthContextType {
  user: (User | null);
  login: (email: string, role: UserRole) => void;//'void' because it doesn't return anything via 'return types'
  logout: () => void;
}