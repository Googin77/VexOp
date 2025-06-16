// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC925LR45LRaxWwTZ8_grG0LQTszxJvWHo",
  authDomain: "VexOp+.firebaseapp.com",
  projectId: "VexOp+",
  storageBucket: "VexOp+.appspot.com",
  messagingSenderId: "255481704627",
  appId: "1:255481704627:web:b528e951946daef72f00c6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export initialized services
export const auth = getAuth(app);
export const db = getFirestore(app);
