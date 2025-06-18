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
