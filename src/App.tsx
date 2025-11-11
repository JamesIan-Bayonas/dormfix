// src/App.tsx

import React from 'react';
import  { useAuth } from '../src/components/UserContext'; // Import the useAuth hook
import Login from '../src/components/Login'; // Assuming you create this file
// import other components like Dashboard, Header, etc.

const App: React.FC = () => {
  const { user, logout } = useAuth(); // Access user state and logout function

  return (
    <div className="App">
      <header>
        <h1 className = 'text-green-500'>DormFix App</h1>
        {/* Conditional rendering for logout button */}
        {user ? (
          <div>
            <span className = 'text-green-500'>Logged in as: **{user.name}** ({user.role})</span>
            <button onClick={logout} style={{ marginLeft: '10px' }}>Log Out</button>
          </div>
        ) : (
          <span>Not logged in.</span>
        )}
      </header>

      <main>
        {/* Conditional rendering based on user role */}

        {!user ? (
          <Login /> // Show login page if no user
        ) : user.role === 'landlord' ? (
          <div>{/* Landlord Dashboard Component */}<h2>Landlord Dashboard</h2></div> 
        ) : (
          <div>{/* Tenant View Component */}<h2>Tenant View</h2></div>
        )}
      </main>
    </div>
  );
};

export default App;