// src/modules/IntegrationSettings.jsx

import React, { useState, useEffect, useContext } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../AuthContext';
import { toast } from 'react-toastify';

const IntegrationSettings = () => {
  const { currentUser } = useContext(AuthContext);
  const [companyId, setCompanyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const fetchCompanyId = async () => {
      try {
        const userDocRef = doc(db, 'users1', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setCompanyId(userDocSnap.data().company);
        } else {
          toast.error('Could not find user profile. Please contact support.');
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        toast.error('An error occurred while loading your company information.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyId();
  }, [currentUser]);

  const handleConnectXero = async () => {
    if (!companyId) {
      toast.error('Company information is missing. Cannot connect to Xero.');
      return;
    }

    toast.info("Preparing to connect to Xero...");

    try {
      const functionBaseUrl = 'https://australia-southeast1-buildops-dashboard.cloudfunctions.net';
      const connectUrl = `${functionBaseUrl}/xeroAuth/initiate?companyId=${companyId}`;
      
      // =================================================================
      // === THE FIX IS HERE ===
      // Add `cache: 'no-cache'` to the fetch options.
      // This forces the browser to make a fresh request every time,
      // ignoring any cached 304 responses.
      // =================================================================
      const response = await fetch(connectUrl, { cache: 'no-cache' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to get connection URL from server.' }));
        throw new Error(errorData.message);
      }
      
      const data = await response.json();
      const { consentUrl } = data;

      if (consentUrl) {
        window.location.href = consentUrl;
      } else {
        throw new Error('Consent URL was not provided by the server.');
      }

    } catch (err) {
      console.error("Error initiating Xero connection:", err);
      toast.error(`Error: ${err.message || "Could not start the Xero connection process."}`);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading Settings...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Integrations</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center">
          <img src="https://developer.xero.com/static/images/xero-logo.svg" alt="Xero Logo" className="h-8 w-auto mr-4"/>
          <h2 className="text-2xl font-semibold text-gray-700">Xero</h2>
        </div>
        <p className="text-gray-600 my-4">
          Connect your Xero account to automatically sync invoices, bills, and contacts. 
          This will keep your financial data up-to-date across both platforms.
        </p>
        
        <button 
          onClick={handleConnectXero} 
          disabled={isLoading || !companyId}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Connect to Xero
        </button>
      </div>
    </div>
  );
};

export default IntegrationSettings;
