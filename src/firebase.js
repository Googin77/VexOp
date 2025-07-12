// src/firebase.js (Corrected)

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC925LR45LRaxWwTZ8_grG0LQTszxJvWHo",
  authDomain: "buildops-dashboard.firebaseapp.com",
  projectId: "buildops-dashboard",
  // --- THIS IS THE FIX ---
  // The storageBucket should end in .appspot.com
  storageBucket: "buildops-dashboard.appspot.com",
  messagingSenderId: "255481704627",
  appId: "1:255481704627:web:b528e951946daef72f00c6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize Firestore
const db = getFirestore(app);

// Constant for the user-facing name of the project
const projectName = "VexOp";

// Set persistence to local storage
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("Error setting persistence:", error);
    });

export { app, auth, db, storage, firebaseConfig, projectName };
