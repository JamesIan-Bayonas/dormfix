// src/App.tsx
import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast'; // 🛡️ 1. Import the Toaster
import { AuthProvider, useAuth } from './components/UserContext';
import Login from './components/Login';
import Register from './components/dashboards/Register'; 
import { TenantDashboard } from './components/dashboards/TenantDashboard'; 
import { LandlordDashboard } from './components/dashboards/LandlordDashboard';
import { PendingApproval } from './components/tenant/PendingApproval';

const AppContent: React.FC = () => {
    const { user, isLoading} = useAuth();
    
    // Track if we are on the Register screen
    const [showRegister, setShowRegister] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // Unauthenticated View Logic
    if (!user) {
        if (showRegister) {
            // Show Register component, pass a way to go back to Login
            return <Register onToggleLogin={() => setShowRegister(false)} />;
        }
        // Show Login component, pass a way to go to Register
        return <Login onToggleRegister={() => setShowRegister(true)} />;
    }

    if (!user.isApproved) {
        return <PendingApproval />;
    }

    // Authenticated View Logic
    if (user.role === 'tenant') return <TenantDashboard />;
    if (user.role === 'landlord') return <LandlordDashboard />;

    return null;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            {/* 🛡️ 2. Place the Toaster here so it sits on top of everything */}
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
            {/* Your custom routing logic remains completely untouched below */}
            <AppContent />
        </AuthProvider>
    );
};

export default App;