// src/assets/components/Login.tsx 

import React, { useState } from 'react';
import { useAuth } from './UserContext'; // Import the useAuth hook
import type { UserRole } from '../types/types.ts';

const Login: React.FC = () => {
  const { login, user } = useAuth(); // Destructure login function and user state
  
  // State for form inputs
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('tenant'); // Default role to tenant

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) { // Ensure a role is selected
        login(email, role); // Call the login function from context
    }
  };

  // If the user is logged in, show a different message/UI
  if (user) {
    return <h2>Welcome, {user.name}! You are logged in as a {user.role}.</h2>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Login</h3>
      
      {/* Email Input */}
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g., tenant@dormfix.com"
          required
        />
      </div>
      
      {/* Role Selector */}
      <div>
        <label htmlFor="role">Login As:</label>
        <select 
            id="role"
            value={role ?? ''} 
            onChange={(e) => setRole(e.target.value as UserRole)}
            required
        >
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
        </select>
      </div>

      <button type="submit">Log In</button>
      <p>Try: tenant@dormfix.com (Tenant) or landlord@dormfix.com (Landlord)</p>
    </form>
  );
};

export default Login;