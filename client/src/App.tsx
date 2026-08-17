// src/App.tsx
import { BrowserRouter as Router } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './components/UserContext';
import Login from './components/Login';
import Register from './components/dashboards/Register'; 
import { TenantDashboard } from './components/dashboards/TenantDashboard'; 
import { LandlordDashboard } from './components/dashboards/LandlordDashboard';
import { PendingApproval } from './components/tenant/PendingApproval';
import { RejectedAccess } from './components/tenant/RejectedAccess';

const AppContent: React.FC = () => {
    const { user, isLoading } = useAuth();
    const [showRegister, setShowRegister] = useState(false);
    const [hasHousingLink, setHasHousingLink] = useState<boolean | null>(null);
    const [isCheckingLink, setIsCheckingLink] = useState(false);

    const checkTenantHousing = async () => {
        if (!user || user.role !== 'tenant') return;
        setIsCheckingLink(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/tenant/details/${user.id}`);
            const data = await res.json();
            setHasHousingLink(!data.error && !data.isUnlinked);
        } catch {
            setHasHousingLink(false);
        } finally {
            setIsCheckingLink(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'tenant') {
            checkTenantHousing();
        }
    }, [user?.id, user?.role]);

    if (isLoading || (user?.role === 'tenant' && isCheckingLink && hasHousingLink === null)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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