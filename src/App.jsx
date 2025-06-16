import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "./firebase";

import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import ClientDashboardHome from "./ClientDashboardHome";
import Homepage from "./Homepage"; // Import the new Homepage component

// Full modules
import ProjectsModule from "./modules/ProjectsModule";
import InvoicesModule from "./modules/InvoicesModule";
import CRMModule from "./modules/CRMModule";
import MetricsModule from "./modules/MetricsModule";
import HRDocumentsModule from "./modules/HRDocumentsModule";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase login state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const emailNormalized = firebaseUser.email.trim().toLowerCase();
        const role = emailNormalized === "ggouge7@gmail.com" ? "admin" : "client";

        try {
          const userDocRef = doc(db, "users1", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const company = userData.company;

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role,
              company,
            });
          } else {
            console.warn("No matching user document found in Firestore.");
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user metadata:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => setUser(null))
      .catch((error) => console.error("Logout error:", error));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Homepage />} /> {/* Homepage route */}
      <Route path="/login" element={<Login />} />

      {/* Admin dashboard */}
      <Route
        path="/admin"
        element={
          user?.role === "admin" ? (
            <AdminDashboard onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Client dashboard home */}
      <Route
        path="/client"
        element={
          user?.role === "client" ? (
            <ClientDashboardHome user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Full module views */}
      <Route
        path="/client/projects"
        element={
          user?.role === "client" ? (
            <ProjectsModule company={user.company} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/client/invoices"
        element={
          user?.role === "client" ? (
            <InvoicesModule company={user.company} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/client/crm"
        element={
          user?.role === "client" ? (
            <CRMModule company={user.company} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/client/metrics"
        element={
          user?.role === "client" ? (
            <MetricsModule company={user.company} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/client/hrdocuments"
        element={
          user?.role === "client" ? (
            <HRDocumentsModule company={user.company} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
