// src/components/MainLayout.jsx (Final Polish)
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faBriefcase, faCalculator, faFileInvoiceDollar, faUsers, faChartLine, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function MainLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut(auth)
      .then(() => navigate('/login'))
      .catch((error) => console.error("Logout error:", error));
  };

  // Sharpness Fix: Changed rounded-lg to rounded-sm for a sharper corner
  const navLinkClasses = ({ isActive }) =>
    `flex items-center p-2 my-1 rounded-sm transition-colors duration-200 text-base ${
      isActive
        ? 'bg-brand-accent text-black font-bold'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <div className="flex h-screen font-sans">
      <aside className="w-64 flex-shrink-0 bg-brand-dark text-white flex flex-col p-3">
        
        {/* Logo Zoom Fix: The container is now overflow-hidden, and the img has a negative margin */}
        <div 
            className="h-20 bg-white rounded-md flex items-center justify-center mb-4 cursor-pointer overflow-hidden"
            onClick={() => navigate('/client')}
        >
            <img 
                src="/Hlogo.png" 
                alt="VexOp+ Logo" 
                className="max-h-full w-auto -m-2" // The negative margin "zooms" the logo
            />
        </div>

        <nav className="flex-grow">
          <NavLink to="/client" className={navLinkClasses} end>
            <FontAwesomeIcon icon={faHome} className="w-5 h-5 mr-3" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/client/jobs" className={navLinkClasses}>
            <FontAwesomeIcon icon={faBriefcase} className="w-5 h-5 mr-3" />
            <span>Jobs</span>
          </NavLink>
          <NavLink to="/client/quotecalculator" className={navLinkClasses}>
            <FontAwesomeIcon icon={faCalculator} className="w-5 h-5 mr-3" />
            <span>Quote Calculator</span>
          </NavLink>
          <NavLink to="/client/invoices" className={navLinkClasses}>
             <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-5 h-5 mr-3" />
             <span>Invoices</span>
          </NavLink>
          <NavLink to="/client/crm" className={navLinkClasses}>
             <FontAwesomeIcon icon={faUsers} className="w-5 h-5 mr-3" />
             <span>CRM</span>
          </NavLink>
          <NavLink to="/client/metrics" className={navLinkClasses}>
             <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 mr-3" />
             <span>Metrics</span>
          </NavLink>
        </nav>

        <div className="mt-auto">
           <button
             onClick={handleLogout}
             // Sharpness Fix: Also applied rounded-sm here
             className="w-full flex items-center p-2 rounded-sm text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-200 text-base"
           >
             <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5 mr-3" />
             <span>Logout</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-100">
        {children}
      </main>
    </div>
  );
}