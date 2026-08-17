// client/src/components/dashboards/Register.tsx
import React, { useState } from 'react';
import { Home, Mail, Lock, Key, AlertCircle, User, ArrowRight, Eye, EyeOff, Phone } from 'lucide-react';

interface RegisterProps {
    onToggleLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onToggleLogin }) => { 
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'tenant' as 'tenant' | 'landlord',
        landlordCode: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/register`, {
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
        <div className="h-screen w-full flex bg-[#f8f9f5] font-sans text-slate-800 animate-fade-in overflow-hidden">
            
            {/* LEFT SIDE: PINNED BRAND HERO */}
            <div className="hidden lg:flex w-1/2 h-screen sticky top-0 justify-center items-center bg-[#425042] overflow-hidden shrink-0">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80" 
                        alt="Dormitory Architecture" 
                        className="w-full h-full object-cover opacity-25 mix-blend-luminosity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#425042]/95 via-[#344034]/95 to-[#2f3727]/80 mix-blend-multiply" />
                </div>
                <div className="relative z-10 text-white max-w-lg px-12 text-center space-y-5">
                    <div className="mx-auto bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-xl w-14 h-14 flex items-center justify-center shadow-2xl">
                        <Home size={28} className="text-[#e7efdb]" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-serif text-white tracking-tight drop-shadow-sm">Join DormFix</h1>
                    <p className="text-xs text-[#bac3ba] font-medium leading-relaxed tracking-wide">
                        Create an account to start managing room assignments, payments, and maintenance requests.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: INDEPENDENTLY SCROLLABLE & COMPACT FORM */}
            <div className="w-full lg:w-1/2 h-screen overflow-y-auto custom-scrollbar flex flex-col justify-between items-center px-6 py-6 sm:px-12 bg-transparent">
                <div className="w-full max-w-sm my-auto space-y-5 py-2">
                    
                    <div className="text-center lg:text-left border-b border-gray-200/60 pb-3">
                        <h2 className="text-2xl font-serif text-slate-800 tracking-tight">Create Account</h2>
                        <p className="mt-1 text-xs text-slate-400 font-medium">
                            Sign up as a tenant or property manager.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* ROLE SELECTOR */}
                        <div className="flex bg-[#e7efdb]/30 p-1 rounded-sm border border-[#d3e0c0]/50">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, role: 'tenant'})}
                                className={`flex-1 py-2 text-[10px] font-bold tracking-wider uppercase transition-all outline-none rounded-sm ${formData.role === 'tenant' ? 'bg-[#425042] text-white shadow-sm' : 'text-[#5c6e4e] hover:bg-[#e7efdb]'}`}
                            >
                                I am a Tenant
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, role: 'landlord'})}
                                className={`flex-1 py-2 text-[10px] font-bold tracking-wider uppercase transition-all outline-none rounded-sm ${formData.role === 'landlord' ? 'bg-[#425042] text-white shadow-sm' : 'text-[#5c6e4e] hover:bg-[#e7efdb]'}`}
                            >
                                I am a Landlord
                            </button>
                        </div>

                        <div className="space-y-3.5">
                            {/* FULL NAME */}
                            <div>
                                <label htmlFor="name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                                <div className="relative group">
                                    <User size={15} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#5c6e4e] transition-colors pointer-events-none" />
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-none bg-white text-xs text-slate-800 font-medium
                                        focus:bg-[#f8f9f5] focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* EMAIL */}
                            <div>
                                <label htmlFor="email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                                <div className="relative group">
                                    <Mail size={15} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#5c6e4e] transition-colors pointer-events-none" />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-none bg-white text-xs text-slate-800 font-medium
                                        focus:bg-[#f8f9f5] focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* PHONE NUMBER */}
                            <div>
                                <label htmlFor="phoneNumber" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                                <div className="relative group">
                                    <Phone size={15} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#5c6e4e] transition-colors pointer-events-none" />
                                    <input
                                        id="phoneNumber"
                                        type="tel"
                                        className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-none bg-white text-xs text-slate-800 font-medium
                                        focus:bg-[#f8f9f5] focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none"
                                        placeholder="09123456789"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* PASSWORD WITH VISIBILITY TOGGLE */}
                            <div>
                                <label htmlFor="password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={15} className="text-gray-400 group-focus-within:text-[#5c6e4e] transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        className="block w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-none bg-white text-xs text-slate-800 font-medium tracking-widest placeholder:tracking-normal
                                        focus:bg-[#f8f9f5] focus:ring-1 focus:ring-[#425042] focus:border-[#425042] transition-all outline-none"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-slate-600 cursor-pointer outline-none"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* CONDITIONAL: DORM CODE */}
                            {formData.role === 'tenant' && ( 
                                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 pt-1 border-t border-gray-200/60">
                                    <label htmlFor="landlordCode" className="block text-[10px] font-bold text-[#b97a26] uppercase tracking-wider">Landlord / Dorm Code</label>
                                    <div className="relative group">
                                        <Key size={15} className="absolute left-3 top-3 text-[#b97a26] pointer-events-none" />
                                        <input 
                                            id="landlordCode"
                                            type="text" 
                                            placeholder="#8821" 
                                            required 
                                            className="block w-full pl-9 pr-3 py-2.5 border border-[#f5ead0] bg-[#fef9eb] rounded-none text-xs text-slate-800 font-mono tracking-widest
                                            focus:bg-white focus:ring-1 focus:ring-[#b97a26] focus:border-[#b97a26] transition-all outline-none uppercase"
                                            value={formData.landlordCode}
                                            onChange={e => setFormData({...formData, landlordCode: e.target.value})}
                                        />
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-medium pl-0.5">Ask your landlord for this code.</p>
                                </div>
                            )}
                        </div>

                        {/* ERROR BOUNDARY */}
                        {error && (
                            <div className="flex items-start p-2.5 bg-[#fff7f7] border border-[#fce8e8] text-[#cc4747] animate-in fade-in zoom-in-95 duration-150 rounded-sm">
                                <AlertCircle size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-xs font-semibold leading-tight">{error}</p>
                            </div>
                        )}

                        {/* SUBMISSION TRIGGER */}
                        <button
                            type="submit"
                            disabled={isLoading}    
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-sm
                            text-xs font-bold tracking-wider uppercase text-white bg-[#425042] hover:bg-[#344034]
                            focus:outline-none transition-all disabled:opacity-50 select-none cursor-pointer"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    Register Account <ArrowRight size={14} />
                                </span>
                            )}
                        </button>
                    </form>
                    
                    {/* CLEAR & HUMAN FOOTER LINK */}
                    <div className="text-center pt-4 border-t border-gray-200/60">
                        <p className="text-xs text-slate-500 font-medium">
                            Already have an account?{' '}
                            <button 
                                onClick={onToggleLogin} 
                                className="font-bold text-[#425042] hover:text-[#5c6e4e] hover:underline transition-colors outline-none cursor-pointer"
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