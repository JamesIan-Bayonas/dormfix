// client/src/components/dashboards/Register.tsx
import React, { useState } from 'react';
import { Home, Mail, Lock, Key, AlertCircle, User, ArrowRight } from 'lucide-react';

interface RegisterProps {
    onToggleLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onToggleLogin }) => { 
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'tenant' as 'tenant' | 'landlord',
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
            onToggleLogin();

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-[#f8f9f5] font-sans text-slate-800 animate-fade-in">
            
            {/* LEFT SIDE: MATTE OLIVE BRAND HERO */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden justify-center items-center bg-[#425042]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#425042]/95 via-[#344034]/90 to-[#566556]/60 mix-blend-multiply z-10" /> 
                <img 
                    src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80" 
                    alt="Dormitory Building" 
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
                <div className="relative z-20 text-white max-w-sm px-8 text-center space-y-6">
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl">
                            <Home size={32} className="text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-serif text-white tracking-tight">Join DormFix</h1>
                    <p className="text-base text-[#bac3ba] font-light leading-relaxed">
                        Create your account to start managing your dormitory experience.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: THE REGISTRATION FORM */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 bg-transparent">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-serif text-slate-800 tracking-tight">Create Account</h2>
                        <p className="mt-1.5 text-xs text-slate-400 font-medium">Sign up as a tenant or landlord.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        
                        {/* Role Toggle Selector (Styled to match design theme) */}
                        <div className="flex bg-gray-200/50 p-1 rounded-xl border border-gray-200/40">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, role: 'tenant'})}
                                className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase rounded-lg transition-all outline-none ${formData.role === 'tenant' ? 'bg-white shadow-xs text-[#425042]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                I am a Tenant
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, role: 'landlord'})}
                                className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase rounded-lg transition-all outline-none ${formData.role === 'landlord' ? 'bg-white shadow-xs text-[#425042]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                I am a Landlord
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Full Name Input */}
                            <div>
                                <label htmlFor="name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                                <div className="relative group">
                                    <User size={16} className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-[#657655] transition-colors pointer-events-none" />
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium
                                        bg-white focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none shadow-xs"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                                <div className="relative group">
                                    <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-[#657655] transition-colors pointer-events-none" />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium
                                        bg-white focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none shadow-xs"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                                <div className="relative group">
                                    <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-[#657655] transition-colors pointer-events-none" />
                                    <input
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium
                                        bg-white focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none shadow-xs"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* CONDITIONAL: Dynamic Landlord Spot Allocation Code */}
                            {formData.role === 'tenant' && ( 
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label htmlFor="landlordCode" className="block text-[10px] font-bold text-[#5c6e4e] uppercase tracking-wider">Landlord's Dorm Code</label>
                                    <div className="relative group">
                                        <Key size={16} className="absolute left-3.5 top-3.5 text-[#657655] pointer-events-none" />
                                        <input 
                                            id="landlordCode"
                                            type="text" 
                                            placeholder="#8821" 
                                            required 
                                            className="block w-full pl-10 pr-3 py-3 border border-[#d3e0c0] bg-[#e7efdb]/30 rounded-xl text-xs text-gray-700 font-mono tracking-widest
                                            focus:bg-white focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none"
                                            value={formData.landlordCode}
                                            onChange={e => setFormData({...formData, landlordCode: e.target.value})}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium pl-1">Ask your property provider for this custom identification token.</p>
                                </div>
                            )}
                        </div>

                        {/* Error Handling Notification Block */}
                        {error && (
                            <div className="flex items-center p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 animate-in fade-in zoom-in-95 duration-150">
                                <AlertCircle size={16} className="mr-2.5 flex-shrink-0" />
                                <p className="text-xs font-semibold">{error}</p>
                            </div>
                        )}

                        {/* Submission Form Trigger */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm 
                            text-xs font-bold tracking-wider uppercase text-white bg-[#425042] hover:bg-[#344034]
                            focus:outline-none transition-all disabled:opacity-50 select-none cursor-pointer"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    Register Account <ArrowRight size={14} />
                                </span>
                            )}
                        </button>
                    </form>
                    
                    {/* Switch Toggle Anchor Links */}
                    <div className="mt-8 text-center pt-4 border-t border-gray-200/40">
                        <p className="text-xs text-slate-400 font-medium">
                            Already have an account?{' '}
                            <button 
                                onClick={onToggleLogin} 
                                className="font-bold text-[#5c6e4e] hover:text-[#425042] hover:underline transition-colors outline-none"
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