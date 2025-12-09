import React, { useState } from 'react';
import { Home, Mail, Lock, Key, AlertCircle } from 'lucide-react';

interface RegisterProps {
    onToggleLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onToggleLogin }) => { 
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'tenant' as 'tenant' | 'landlord', // Explicitly type the role
        landlordCode: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Registration failed');

            alert('Registration Successful! Please login.');
            onToggleLogin(); // Switch back to login view

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-emerald-950 overflow-hidden">
            
            {/* LEFT SIDE: "DormFix" panel (Identical to Homepage.tsx) */}
            <div className="hidden lg:flex w-1/2 bg-emerald-950 relative overflow-hidden justify-center items-center">
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
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">Join DormFix</h1>
                    <p className="text-lg text-emerald-100 font-light leading-relaxed">
                        Create your account to start managing your dormitory experience.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: The Registration Form (White background) */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
                        <p className="mt-2 text-sm text-gray-500">Sign up as a tenant or landlord.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {/* Role Toggle (Styled to match theme) */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, role: 'tenant'})}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.role === 'tenant' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                I am a Tenant
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, role: 'landlord'})}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.role === 'landlord' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                I am a Landlord
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Full Name Input */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    {/* Using Home icon as a placeholder for User icon if not imported */}
                                    <Home size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-gray-50 focus:bg-white"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-gray-50 focus:bg-white"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                                    <input
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-gray-50 focus:bg-white"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* CONDITIONAL: Landlord Code */}
                            {/* renders if the user is a tenant */}
                            {formData.role === 'tenant' && ( 
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label htmlFor="landlordCode" className="block text-sm font-medium text-emerald-700 mb-1">Landlord's Dorm Code</label>
                                    <div className="relative">
                                        <Key size={18} className="absolute left-3 top-3 text-emerald-500 pointer-events-none" />
                                        <input 
                                            id="landlordCode"
                                            type="text" 
                                            placeholder="#8821" 
                                            required 
                                            className="block w-full pl-10 pr-3 py-2.5 border-2 border-emerald-100 rounded-lg text-gray-900 placeholder-emerald-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200 sm:text-sm bg-emerald-50/30 focus:bg-white font-mono tracking-wider"
                                            value={formData.landlordCode}
                                            onChange={e => setFormData({...formData, landlordCode: e.target.value})}
                                        />
                                    </div>
                                    <p className="text-xs text-emerald-600 mt-1 ml-1">Ask your landlord for this code to join their dorm.</p>
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
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
                                    Creating Account...
                                </span>
                            ) : (
                                "Register"
                            )}
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            Already have an account?{' '}
                            <button 
                                onClick={onToggleLogin} 
                                className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors hover:underline"
                            >
                                Log in here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;