// src/App.tsx
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Users, AlertCircle, Home, User as UserIcon } from 'lucide-react';
import { useAuth } from './components/UserContext';
import { TenantDashboard, LandlordDashboard } from './components/DashBoards'; 
import type { UserRole } from './types/types';

const LoginPage: React.FC = () => {
    // Destructure all necessary state and functions from the updated useAuth hook
    const { login, isLoading, error } = useAuth(); // the user is down in App component
    
    // Local state for form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword  ] = useState('');
    const [role, setRole] = useState<UserRole>('tenant');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Call the updated login function
        login(email, password, role); 
    };

    // ===============================================================
    // LOGIN FORM VIEW (Centered Card Layout - Matching the image)
    // ===============================================================
    return (
    // THE FIX IS HERE: Added "w-full" to remove the "black bar".
    <div className="min-h-screen flex w-full bg-emerald-950 overflow-hidden"> {/*overflow-hidden*/}
      
      {/* LEFT SIDE: "DormFix" panel (Green theme) */}
      <div className="hidden lg:flex w-1/2 bg-emerald-950 relative overflow-hidden justify-center items-center">
        {/* Changed gradient to green hues */}
        <div className="absolute inset-0 bg-linear-to-br from-emerald-900/90 to-emerald-550/90 z-10" /> 
        <img 
          src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80" 
          alt="Dormitory Building" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative z-20 text-white max-w-md px-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
               <Home size={48} className="text-emerald-300" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">DormFix</h1>
          <p className="text-lg text-emerald-100 font-light leading-relaxed">
            Streamlining student housing with efficiency, transparency, and accountability.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: The Login Form (White background) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome</h2>
            <p className="mt-2 text-sm text-gray-500">
              Please sign in to your DormFix account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-gray-50 focus:bg-white"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-gray-50 focus:bg-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {/* Role Selector */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Login As
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users size={18} className="text-gray-400" />
                  </div>
                  <select 
                    id="role"
                    value={role} 
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-gray-50 focus:bg-white appearance-none"
                  >
                    <option value="tenant">Tenant</option>
                    <option value="landlord">Landlord</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Hint text */}
            <p className='text-xs text-center text-gray-500 bg-gray-100 p-2 rounded-md'>
              Try: <strong className="text-gray-700">tenant@dormfix.com</strong> (Pass: tenantpass)
              <br/>
              Try: <strong className="text-gray-700">landlord@dormfix.com</strong> (Pass: adminpass)
            </p>

            {/* Error Message Display */}
            {error && (
              <div className="flex items-center p-3 rounded-lg bg-red-50 border border-red-300 text-red-700">
                <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          {/* Registration link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <a href="#" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => { // user 
    const { user } = useAuth();

    if (user) {
        if (user.role === 'tenant') {
            return <TenantDashboard />;
        }
        if (user.role === 'landlord') {
            return <LandlordDashboard />;
        }
    }

    return <LoginPage />;
}

export default App;