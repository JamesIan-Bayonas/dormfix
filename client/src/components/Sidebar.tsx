// components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  
  const getLinkClass = ({ isActive }: { isActive: boolean }) => 
    `block py-2.5 px-4 rounded transition duration-200 ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <div className="w-64 bg-gray-800 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      
      {/* Logo / Title */}
      <div className="text-white text-2xl font-semibold text-center px-4 mb-8">
        DormFix
      </div>

      {/* Navigation Links */}
      <nav>
        {/* Link to Overview (Default) */}
        <NavLink to="/landlord" end className={getLinkClass}>
          Dashboard Overview
        </NavLink>

        {/* Link to Payment - Triggers the Outlet change */}
        <NavLink to="/landlord/payment" className={getLinkClass}>
          Payments
        </NavLink>

        {/* Link to Tenants */}
        <NavLink to="/landlord/tenants" className={getLinkClass}>
          Tenants
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;