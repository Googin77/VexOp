// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC925LR45LRaxWwTZ8_grG0LQTszxJvWHo",
  authDomain: "buildops-dashboard.firebaseapp.com",
  projectId: "buildops-dashboard",
  storageBucket: "buildops-dashboard.firebasestorage.app",
  messagingSenderId: "255481704627",
  appId: "1:255481704627:web:b528e951946daef72f00c6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app); // Initialize Firestore

// Constant for the user-facing name of the project
const projectName = "VexOp";

export { app, auth, db, firebaseConfig, projectName }; // Export Firestore
