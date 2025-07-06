// src/App.jsx (Updated)
import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

// Layout
import MainLayout from "./components/MainLayout"; // <-- Import MainLayout

// Pages
import Login from "./Login";
import Homepage from "./Homepage";
import ClientDashboardHome from "./ClientDashboardHome";
import JobsModule from "./modules/JobsModule";
import JobDetail from "./modules/JobDetail";
import QuoteCalculatorModule from "./modules/QuoteCalculatorModule";
// ... import other modules

export default function App() {
  const { currentUser, authInitialized } = useContext(AuthContext);

  if (!authInitialized) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // A wrapper for protected routes
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }
    // Wrap the children (the page component) in the MainLayout
    return <MainLayout>{children}</MainLayout>;
  };

  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/client" />} />

      {/* All client routes are now nested and protected */}
      <Route path="/client" element={<ProtectedRoute><ClientDashboardHome /></ProtectedRoute>} />
      <Route path="/client/jobs" element={<ProtectedRoute><JobsModule company={currentUser?.company} /></ProtectedRoute>} />
      <Route path="/client/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
      <Route path="/client/quotecalculator" element={<ProtectedRoute><QuoteCalculatorModule /></ProtectedRoute>} />
      {/* Add other protected routes here in the same way */}

      <Route path="*" element={<Navigate to={currentUser ? "/client" : "/"} replace />} />
    </Routes>
  );
}