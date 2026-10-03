import React, { useState } from 'react';
import { Mail, Lock, Key, User, ArrowRight, Eye, EyeOff, Phone, Check } from 'lucide-react';
import { AuthLayout } from '../ui/AuthLayout';
import { Button, IconButton } from '../ui/Button';
import { FormField, Input } from '../ui/FormField';
import { ErrorMessage } from '../ui/Feedback';
import toast from 'react-hot-toast';

interface RegisterProps { onToggleLogin: () => void }

const Register: React.FC<RegisterProps> = ({ onToggleLogin }) => {
    const [formData, setFormData] = useState({
        name: '', email: '', phoneNumber: '', password: '',
        role: 'tenant' as 'tenant' | 'landlord', landlordCode: ''
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
            toast.success('Account created. Please sign in.');
            onToggleLogin();
        } catch (err: unknown) {
            setError(err instanceof Error && err.message ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Create an account" description="Choose your role to get started with DormFix.">
            <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isLoading}>
                <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-ink">I am a</legend>
                    <div className="grid grid-cols-2 gap-3">
                        {(['tenant', 'landlord'] as const).map((role) => (
                            <label key={role} className="relative cursor-pointer">
                                <input type="radio" name="role" value={role} checked={formData.role === role}
                                    className="peer sr-only" onChange={() => setFormData({ ...formData, role })} />
                                <span className="flex min-h-11 items-center justify-center gap-2 rounded-control border border-control-border bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-content peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-focus">
                                    {formData.role === role && <Check size={16} aria-hidden="true" />}
                                    {role === 'tenant' ? 'Tenant' : 'Landlord'}
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                <FormField id="name" label="Full name">
                    {(field) => <Input {...field} name="name" autoComplete="name" required leadingIcon={<User size={18} />}
                        placeholder="Your full name" value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} />}
                </FormField>
                <FormField id="email" label="Email address">
                    {(field) => <Input {...field} name="email" type="email" autoComplete="email" required leadingIcon={<Mail size={18} />}
                        placeholder="you@example.com" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} />}
                </FormField>
                <FormField id="phoneNumber" label="Phone number" optional>
                    {(field) => <Input {...field} name="phoneNumber" type="tel" autoComplete="tel" leadingIcon={<Phone size={18} />}
                        placeholder="09123456789" value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />}
                </FormField>
                <FormField id="password" label="Password">
                    {(field) => <Input {...field} name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                        required leadingIcon={<Lock size={18} />} value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        trailingAction={
                            <IconButton label={showPassword ? 'Hide password' : 'Show password'} aria-controls="password"
                                onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </IconButton>
                        } />}
                </FormField>
                {formData.role === 'tenant' && (
                    <FormField id="landlordCode" label="Landlord / dorm code" hint="Ask your landlord for this code.">
                        {(field) => <Input {...field} name="landlordCode" required leadingIcon={<Key size={18} />}
                            placeholder="#8821" className="font-mono" value={formData.landlordCode}
                            onChange={(e) => setFormData({ ...formData, landlordCode: e.target.value })} />}
                    </FormField>
                )}
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <Button type="submit" loading={isLoading} loadingText="Creating account…" className="w-full">
                    Create account <ArrowRight size={18} aria-hidden="true" />
                </Button>
            </form>
            <div className="border-t border-divider pt-4 text-center">
                <p className="text-sm text-muted">Already have an account?</p>
                <Button variant="quiet" onClick={onToggleLogin} className="mt-1">Sign in</Button>
            </div>
        </AuthLayout>
    );
};

export default Register;
