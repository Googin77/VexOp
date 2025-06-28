// AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth"; // Import onAuthStateChanged
import { doc, getDoc } from "firebase/firestore"; // Import doc and getDoc
import { auth, db } from "./firebase"; // Import auth and db

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // Rename to currentUser

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users1", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const company = userData.company;

            setCurrentUser({
              // Update setCurrentUser
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              company,
            });
          } else {
            console.warn("No matching user document found in Firestore.");
            setCurrentUser(null); // Update setCurrentUser
          }
        } catch (error) {
          console.error("Error fetching user metadata:", error);
          setCurrentUser(null); // Update setCurrentUser
        }
      } else {
        setCurrentUser(null); // Update setCurrentUser
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}






import React, { useState, useEffect, useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom"; // Import useLocation

import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "./firebase";

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
    const { currentUser, setCurrentUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const location = useLocation(); // Use useLocation hook

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

                        setCurrentUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            role,
                            company,
                        });
                    } else {
                        console.warn("No matching user document found in Firestore.");
                        setCurrentUser(null);
                    }
                } catch (error) {
                    console.error("Error fetching user metadata:", error);
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [setCurrentUser]);

    const handleLogout = () => {
        signOut(auth)
            .then(() => setCurrentUser(null))
            .catch((error) => console.error("Logout error:", error));
    };

    if (loading) return <div>Loading...</div>;

    return (
        // Your routes, no need for extra wrapping here
        <Routes>
            <Route path="/" element={<Homepage />} />

            {/* Explicit Login Route */}
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
                    currentUser?.role === "client" ? (
                        <ClientDashboardHome user={currentUser} onLogout={handleLogout} />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            <Route
                path="/client/projects"
                element={
                    currentUser?.role === "client" ? (
                        <ProjectsModule company={currentUser.company} />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            <Route
                path="/client/invoices"
                element={
                    currentUser?.role === "client" ? (
                        <InvoicesModule company={currentUser.company} />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            <Route
                path="/client/crm"
                element={
                    currentUser?.role === "client" ? (
                        <CRMModule company={currentUser.company} />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            <Route
                path="/client/metrics"
                element={
                    currentUser?.role === "client" ? (
                        <MetricsModule company={currentUser.company} />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

            {/* Quote Calculator page */}
            <Route
                path="/client/quotecalculator"
                element={
                    currentUser?.role === "client" ? (
                        <QuoteCalculatorModule company={currentUser.company} />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

            {/* Catch-All Route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
