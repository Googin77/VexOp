// src/modules/IntegrationSettings.jsx

import React, { useState, useEffect, useContext } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Assuming your firebase.js exports 'db'
import { AuthContext } from '../AuthContext'; // Using your existing AuthContext

const IntegrationSettings = () => {
  const { currentUser } = useContext(AuthContext);
  const [companyId, setCompanyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      const fetchCompanyId = async () => {
        try {
          const userDocRef = doc(db, 'users1', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setCompanyId(userDocSnap.data().company);
          } else {
            setError('Could not find user profile. Please contact support.');
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError('An error occurred while loading your company information.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchCompanyId();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  // --- THIS IS THE FIX ---
  // The function is now async to handle the fetch request.
  const handleConnectXero = async () => {
    if (!companyId) {
      setError('Cannot connect to Xero without a valid Company ID.');
      return;
    }
    setError(''); // Clear previous errors

    try {
      const functionBaseUrl = 'https://australia-southeast1-buildops-dashboard.cloudfunctions.net';
      const connectUrl = `${functionBaseUrl}/xeroAuth/initiateXeroAuth?companyId=${companyId}`;
      
      // 1. Fetch the consent URL from your Cloud Function.
      const response = await fetch(connectUrl);
      if (!response.ok) {
        throw new Error('Failed to get connection URL from server.');
      }
      
      // 2. Parse the JSON response to get the consentUrl.
      const data = await response.json();
      const { consentUrl } = data;

      if (consentUrl) {
        // 3. Redirect the user's browser to the Xero login page.
        window.location.href = consentUrl;
      } else {
        throw new Error('Consent URL was not provided by the server.');
      }

    } catch (err) {
      console.error("Error initiating Xero connection:", err);
      setError("Could not start the Xero connection process. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Integrations</h1>
      
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center">
          <img src="https://developer.xero.com/static/images/xero-logo.svg" alt="Xero Logo" className="h-8 mr-4"/>
          <h2 className="text-2xl font-semibold text-gray-700">Xero</h2>
        </div>
        <p className="text-gray-600 my-4">
          Connect your Xero account to automatically sync invoices, bills, and contacts. 
          This will keep your financial data up-to-date across both platforms.
        </p>
        
        <button 
          onClick={handleConnectXero} 
          disabled={!companyId || !currentUser}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Connect to Xero
        </button>
      </div>
    </div>
  );
};

export default IntegrationSettings;
