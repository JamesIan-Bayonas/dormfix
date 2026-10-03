// src/App.tsx
import { BrowserRouter as Router } from 'react-router-dom';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './components/UserContext';
import Login from './components/Login';
import Register from './components/dashboards/Register'; 
import { TenantDashboard } from './components/dashboards/TenantDashboard'; 
import { LandlordDashboard } from './components/dashboards/LandlordDashboard';
import { PendingApproval } from './components/tenant/PendingApproval';
import { RejectedAccess } from './components/tenant/RejectedAccess';
import { LoadingState, ErrorState } from './components/ui/Feedback';
import { Button } from './components/ui/Button';
import { readHousingLink } from './utils/housingLink';

const AppContent: React.FC = () => {
    const { user, isLoading, logout } = useAuth();
    const [showRegister, setShowRegister] = useState(false);
    const [hasHousingLink, setHasHousingLink] = useState<boolean | null>(null);
    const [isCheckingLink, setIsCheckingLink] = useState(false);
    const [linkError, setLinkError] = useState<string | null>(null);
    const linkRequest = useRef(0);
    const [lookupTenantId, setLookupTenantId] = useState<string | null>(null);

    const checkTenantHousing = useCallback(async () => {
        if (!user?.id || user.role !== 'tenant') return;
        const request = ++linkRequest.current;
        setLookupTenantId(user.id);
        setIsCheckingLink(true);
        setLinkError(null);
        setHasHousingLink(null);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/tenant/details/${user.id}`);
            const linked = await readHousingLink(res);
            if (request !== linkRequest.current) return;
            setHasHousingLink(linked);
        } catch {
            if (request === linkRequest.current) setLinkError('Your dormitory link could not be checked. Please try again.');
        } finally {
            if (request === linkRequest.current) setIsCheckingLink(false);
        }
    }, [user?.id, user?.role]);

    useEffect(() => {
        if (user?.role === 'tenant') {
            checkTenantHousing();
        }
        return () => { linkRequest.current += 1; };
    }, [checkTenantHousing, user?.role]);

    if (isLoading || (user?.role === 'tenant' && (lookupTenantId !== user.id || ((isCheckingLink || hasHousingLink === null) && !linkError)))) {
        return (
            <div className="min-h-dvh bg-canvas flex items-center justify-center">
                <LoadingState>Loading your workspace…</LoadingState>
            </div>
        );
    }

    // Unauthenticated View
    if (!user) {
        if (showRegister) {
            return <Register onToggleLogin={() => setShowRegister(false)} />;
        }
        return <Login onToggleRegister={() => setShowRegister(true)} />;
    }

    // Tenant Gatekeepers
    if (user.role === 'tenant') {
        if (linkError) return <main className="mx-auto max-w-form p-4 sm:p-6"><ErrorState title="Dormitory connection unavailable" description={linkError}
            action={<div className="flex flex-wrap gap-3"><Button onClick={checkTenantHousing}>Try again</Button><Button variant="secondary" onClick={logout}>Sign out</Button></div>} /></main>;
        if (hasHousingLink === false) {
            return <RejectedAccess onRelinkSuccess={checkTenantHousing} />;
        }
        if (!user.isApproved) {
            return <PendingApproval />;
        }
        return <TenantDashboard />;
    }

    // Landlord Gatekeeper
    if (user.role === 'landlord') {
        return <LandlordDashboard />;
    }

    return null;
};

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <Toaster 
                    position="bottom-right" 
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1e293b', 
                            color: '#fff',
                        },
                        success: {
                            iconTheme: { primary: '#10b981', secondary: '#fff' }, 
                        },
                        error: {
                            iconTheme: { primary: '#ef4444', secondary: '#fff' }, 
                        },
                    }} 
                />
                <AppContent />
            </AuthProvider>
        </Router>
    );
};

export default App;
