// src/App.tsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/UserContext';
import Login from './components/Homepage';
import Register from './components/Register'; 
import { TenantDashboard } from './components/dashboards/TenantDashboard'; 
import { LandlordDashboard } from './components/dashboards/LandlordDashboard';

const AppContent: React.FC = () => {
    const { user, isLoading } = useAuth();
    
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

    // Authenticated View Logic
    if (user.role === 'tenant') return <TenantDashboard />;
    if (user.role === 'landlord') return <LandlordDashboard />;

    return null;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;