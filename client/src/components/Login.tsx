import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from './UserContext';
import { AuthLayout } from './ui/AuthLayout';
import { Button, IconButton } from './ui/Button';
import { FormField, Input } from './ui/FormField';
import { ErrorMessage } from './ui/Feedback';

interface LoginProps { onToggleRegister: () => void }

const Login: React.FC<LoginProps> = ({ onToggleRegister }) => {
    const { login, isLoading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email, password);
    };

    return (
        <AuthLayout title="Welcome back" description="Sign in to manage your dormitory or view your tenant workspace.">
            <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isLoading}>
                <FormField id="email" label="Email address">
                    {(field) => (
                        <Input {...field} name="email" type="email" autoComplete="email" required
                            leadingIcon={<Mail size={18} />} placeholder="you@example.com"
                            value={email} onChange={(e) => setEmail(e.target.value)} />
                    )}
                </FormField>
                <FormField id="password" label="Password">
                    {(field) => (
                        <Input {...field} name="password" type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password" required leadingIcon={<Lock size={18} />}
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            trailingAction={
                                <IconButton label={showPassword ? 'Hide password' : 'Show password'}
                                    aria-controls="password"
                                    onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </IconButton>
                            } />
                    )}
                </FormField>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <Button type="submit" loading={isLoading} loadingText="Signing in…" className="w-full">
                    Sign in <ArrowRight size={18} aria-hidden="true" />
                </Button>
            </form>
            <div className="border-t border-divider pt-4 text-center">
                <p className="text-sm text-muted">Don't have an account?</p>
                <Button variant="quiet" onClick={onToggleRegister} className="mt-1">Create an account</Button>
            </div>
        </AuthLayout>
    );
};

export default Login;
