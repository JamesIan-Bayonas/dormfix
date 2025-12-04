import React, { useState } from 'react';
import { User, Mail, Lock, Key, ShieldCheck } from 'lucide-react';

interface RegisterProps {
    onToggleLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onToggleLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'tenant',
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

            if (!response.ok) throw new Error(data.error);

            alert('Registration Successful! Please login.');
            onToggleLogin(); // Switch back to login view

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Create Account</h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                        <ShieldCheck size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, role: 'tenant'})}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.role === 'tenant' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                        >
                            I am a Tenant
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, role: 'landlord'})}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.role === 'landlord' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                        >
                            I am a Landlord
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="text" placeholder="Full Name" required 
                                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="email" placeholder="Email Address" required 
                                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="password" placeholder="Password" required 
                                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>

                        {/* CONDITIONAL: Landlord Code */}
                        {formData.role === 'tenant' && (
                            <div className="relative animate-in fade-in slide-in-from-top-2">
                                <Key size={18} className="absolute left-3 top-3 text-indigo-500" />
                                <input 
                                    type="text" placeholder="Landlord's Dorm Code (e.g. #8821)" required 
                                    className="w-full pl-10 pr-3 py-2 border-2 border-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30"
                                    onChange={e => setFormData({...formData, landlordCode: e.target.value})}
                                />
                                <p className="text-xs text-indigo-600 mt-1 ml-1">Ask your landlord for this code.</p>
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" disabled={isLoading}
                        className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <button onClick={onToggleLogin} className="text-indigo-600 font-semibold hover:underline">
                        Log in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;