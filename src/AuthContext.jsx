// src/AuthContext.jsx (Corrected with Custom Claims)

import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // --- THIS IS THE FIX ---
                // When the auth state changes, we get the ID token result.
                // The `true` argument forces a refresh, ensuring we get the latest claims.
                const tokenResult = await user.getIdTokenResult(true);
                
                // The custom claims are on the `claims` object of the token result.
                const claims = tokenResult.claims;

                // Set the current user state using the data from the token.
                setCurrentUser({
                    uid: user.uid,
                    email: user.email,
                    role: claims.role,      // Get role from the token
                    company: claims.company,  // Get company from the token
                });
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        currentUser,
        setCurrentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
