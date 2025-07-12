// src/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
// Import getApp from firebase/app
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Link } from 'react-router-dom'; //

// --- THIS IS THE FIX ---
// Force the Firebase Functions instance to use the correct region.
const functions = getFunctions(getApp(), 'australia-southeast1');
const provisionNewUser = httpsCallable(functions, 'provisionNewUser');

const AdminNav = () => (
    <nav className="bg-white p-4 rounded-lg shadow-md mb-8">
        <ul className="flex space-x-6">
            <li><Link to="/admin" className="font-bold text-blue-600 hover:underline">Provisioning</Link></li>
            <li><Link to="/admin/leads" className="font-bold text-blue-600 hover:underline">Leads</Link></li>
        </ul>
    </nav>
);


const AdminDashboard = () => {
  // State for the new user form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');

  // State for managing UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // State to hold the list of existing companies
  const [companies, setCompanies] = useState([]);

  // Fetch existing companies when the component mounts
  useEffect(() => {
    const fetchCompanies = async () => {
      const companiesCol = collection(db, 'companies');
      const companySnapshot = await getDocs(companiesCol);
      const companyList = companySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompanies(companyList);
    };

    fetchCompanies();
  }, []);

  const handleProvisionUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      // Call the cloud function with the form data
      const result = await provisionNewUser({ email, password, companyId, companyName });
      
      setMessage(result.data.message || 'User provisioned successfully!');
      // Clear the form on success
      setEmail('');
      setPassword('');
      setCompanyName('');
      setCompanyId('');

    } catch (error) {
      console.error('Error provisioning user:', error);
      setMessage(error.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
     <AdminNav />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* --- User Provisioning Form --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Provision New User</h2>
          <form onSubmit={handleProvisionUser} autoComplete="off">
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="companyName">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., ACME Construction"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="companyId">
                Company ID (Short, unique, no spaces)
              </label>
              <input
                id="companyId"
                type="text"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="e.g., acme-construction"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="new-email">
                New User Email
              </label>
              <input
                id="new-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="new-password">
                Temporary Password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-gray-400"
            >
              {isLoading ? 'Provisioning...' : 'Provision User'}
            </button>
          </form>
          {message && (
            <div className={`mt-4 p-3 rounded text-center ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
        </div>

        {/* --- Existing Companies List --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Existing Companies</h2>
          <div className="overflow-y-auto max-h-96">
            <ul>
              {companies.map(company => (
                <li key={company.id} className="border-b py-2">
                  <p className="font-bold">{company.companyName}</p>
                  <p className="text-sm text-gray-500">ID: {company.id}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
