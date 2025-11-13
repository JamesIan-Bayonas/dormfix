import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Home } from 'lucide-react';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call or insert your actual login logic here
    setTimeout(() => setIsLoading(false), 2000);
    console.log('Login attempted with:', formData);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* LEFT SIDE - Visual / Branding 
          matches the "Student housing" context  
      */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden justify-center items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-slate-900/90 z-10" />
        {/* Placeholder image for a dormitory/building */}
        <img 
          src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80" 
          alt="Dormitory Building" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        
        <div className="relative z-20 text-white max-w-md px-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
               <Home size={48} className="text-indigo-300" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">DormFix</h1>
          <p className="text-lg text-indigo-100 font-light leading-relaxed">
            Streamlining student housing with efficiency, transparency, and accountability.
            Manage requests and payments in one place.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form 
          Focuses on user authentication [cite: 112]
      */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-sm space-y-8">
          
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex p-3 bg-indigo-50 rounded-xl mb-3">
              <Home size={32} className="text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">DormFix</h2>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">
              Please sign in to your tenant or landlord account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-5">
              
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-slate-50 focus:bg-white"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-slate-50 focus:bg-white"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
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

          <div className="mt-6 text-center">
             {/* Covers User Registration scope [cite: 112] */}
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;