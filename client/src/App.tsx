// src/App.tsx
import React from 'react';
import { AuthProvider, useAuth } from './components/UserContext';
import Login from './components/Homepage';

// 🛑 CORRECTED IMPORTS: Import from the separate files you created
import { TenantDashboard } from './components/dashboards/TenantDashboard'; 
import { LandlordDashboard } from './components/dashboards/LandlordDashboard';

// The "Conductor" Component
const AppContent: React.FC = () => {
    const { user, isLoading } = useAuth();

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading DormFix...</p>
                </div>
            </div>
        );
    }
    
    // 2. Unauthenticated State
    if (!user) {
        return <Login />;
    }

    // 3. Authenticated State (Routing based on Role)
    if (user.role === 'tenant') {
        return <TenantDashboard />;
    }

    if (user.role === 'landlord') {
        return <LandlordDashboard />;
    }

    return null;
};

// The Root Component
const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;