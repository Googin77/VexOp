// src/modules/IntegrationSettings.jsx

import React, { useState, useEffect, useContext } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../AuthContext';
import { toast } from 'react-toastify'; // Import toast for notifications

const IntegrationSettings = () => {
  const { currentUser } = useContext(AuthContext);
  const [companyId, setCompanyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the company ID when the component mounts
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

  // Handle the connection process to Xero
  const handleConnectXero = async () => {
    if (!companyId) {
      toast.error('Company information is missing. Cannot connect to Xero.');
      return;
    }

    // Give immediate feedback to the user
    toast.info("Preparing to connect to Xero...");

    try {
      const functionBaseUrl = 'https://australia-southeast1-buildops-dashboard.cloudfunctions.net';
      const connectUrl = `${functionBaseUrl}/xeroAuth/initiate?companyId=${companyId}`;
      
      // 1. Fetch the consent URL from your Cloud Function
      const response = await fetch(connectUrl);
      
      if (!response.ok) {
        // Parse the error message from the server if possible
        const errorData = await response.json().catch(() => ({ message: 'Failed to get connection URL from server.' }));
        throw new Error(errorData.message);
      }
      
      // 2. Parse the JSON response to get the consentUrl
      const data = await response.json();
      const { consentUrl } = data;

      if (consentUrl) {
        // 3. Redirect the user's browser to the Xero login page
        window.location.href = consentUrl;
      } else {
        throw new Error('Consent URL was not provided by the server.');
      }

    } catch (err) {
      console.error("Error initiating Xero connection:", err);
      toast.error(`Error: ${err.message || "Could not start the Xero connection process."}`);
    }
  };

  // Display a loading state while fetching company data
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