// AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [authInitialized, setAuthInitialized] = useState(false); // New state

  useEffect(() => {
    let resolveAuthPromise;

    const authPromise = new Promise((resolve) => {
      resolveAuthPromise = resolve;
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users1", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const company = userData.company;

            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
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
      setAuthInitialized(true); // Set initialized to true
      resolveAuthPromise(); // Resolve the promise
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, authInitialized, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}
