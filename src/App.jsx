import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import ClientDashboardHome from "./ClientDashboardHome";
import Homepage from "./Homepage";
import ProjectsModule from "./modules/ProjectsModule";
import InvoicesModule from "./modules/InvoicesModule";
import CRMModule from "./modules/CRMModule";
import MetricsModule from "./modules/MetricsModule";
import QuoteCalculatorModule from "./modules/QuoteCalculatorModule";
import { AuthContext } from "./AuthContext";

export default function App() {
  const { currentUser, authInitialized } = useContext(AuthContext);

  const handleLogout = () => {
    signOut(auth)
      .then(() => console.log("User signed out"))
      .catch((error) => console.error("Logout error:", error));
  };

  // Show loading indicator until auth is initialized
  if (!authInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />

      {/* Admin Route */}
      <Route
        path="/admin"
        element={
          currentUser?.role === "admin" ? (
            <AdminDashboard onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Client Routes */}
      <Route
        path="/client"
        element={
          currentUser ? (
            <ClientDashboardHome onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/client/projects"
        element={
          currentUser ? (
            <ProjectsModule />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/client/invoices"
        element={
          currentUser ? (
            <InvoicesModule />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/client/crm"
        element={
          currentUser ? (
            <CRMModule />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/client/metrics"
        element={
          currentUser ? (
            <MetricsModule />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/client/quotecalculator"
        element={
          currentUser ? (
            <QuoteCalculatorModule />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={currentUser ? null : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
