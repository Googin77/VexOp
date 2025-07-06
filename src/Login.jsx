// src/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { AuthContext } from "./AuthContext";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const navigate = useNavigate();
  const { setCurrentUser } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userDocRef = doc(db, "users1", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("No user data found in Firestore.");
      }

      const userData = userDocSnap.data();
      const role = userData.role || "client";
      const company = userData.company || "Default";

      setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email, role, company });
      navigate(`/${role}`);
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/Hlogo.png"
            alt="VexOp+ Logo"
            className="w-48 h-auto mx-auto"
          />
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-brand-accent">
          <h1 className="text-2xl font-bold text-center text-brand-dark mb-6">
            Sign in to your account
          </h1>

          {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center text-sm">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent focus:border-transparent transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent focus:border-transparent transition"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-dark text-white font-bold py-3 px-4 rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark transition disabled:bg-gray-400"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Need an account?{' '}
          <a href="#" className="font-medium text-brand-accent-secondary hover:underline">
            Contact Us
          </a>
        </p>
      </div>
    </div>
  );
}