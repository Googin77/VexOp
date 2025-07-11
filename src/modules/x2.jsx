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

  // --- Xero Connection Handler ---
  const handleConnectXero = async () => {
    if (!companyId) {
      toast.error('Company information is missing. Cannot connect to Xero.');
      return;
    }
    toast.info("Preparing to connect to Xero...");
    try {
      const functionBaseUrl = 'https://australia-southeast1-buildops-dashboard.cloudfunctions.net';
      const cacheBuster = new Date().getTime();
      const connectUrl = `${functionBaseUrl}/xeroAuth/initiate?companyId=${companyId}&cacheBuster=${cacheBuster}`;
      const response = await fetch(connectUrl);
      if (!response.ok) throw new Error('Failed to get connection URL from server.');
      const data = await response.json();
      if (data.consentUrl) {
        window.location.href = data.consentUrl;
      } else {
        throw new Error('Consent URL was not provided by the server.');
      }
    } catch (err) {
      console.error("Error initiating Xero connection:", err);
      toast.error(`Error: ${err.message || "Could not start the Xero connection process."}`);
    }
  };

  // --- QuickBooks Connection Handler (New) ---
  const handleConnectQuickBooks = async () => {
    if (!companyId) {
      toast.error('Company information is missing. Cannot connect to QuickBooks.');
      return;
    }
    toast.info("Preparing to connect to QuickBooks...");
    try {
      const functionBaseUrl = 'https://australia-southeast1-buildops-dashboard.cloudfunctions.net';
      const cacheBuster = new Date().getTime();
      // Call our new QuickBooks endpoint
      const connectUrl = `${functionBaseUrl}/quickbooksAuth/initiate?companyId=${companyId}&cacheBuster=${cacheBuster}`;
      const response = await fetch(connectUrl);
      if (!response.ok) throw new Error('Failed to get QuickBooks connection URL from server.');
      const data = await response.json();
      if (data.consentUrl) {
        window.location.href = data.consentUrl;
      } else {
        throw new Error('QuickBooks Consent URL was not provided by the server.');
      }
    } catch (err) {
      console.error("Error initiating QuickBooks connection:", err);
      toast.error(`Error: ${err.message || "Could not start the QuickBooks connection process."}`);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading Settings...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Integrations</h1>

      {/* --- Xero Integration Card --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <div className="flex items-center">
          <img src="https://developer.xero.com/static/images/xero-logo.svg" alt="Xero Logo" className="h-8 w-auto mr-4"/>
          <h2 className="text-2xl font-semibold text-gray-700">Xero</h2>
        </div>
        <p className="text-gray-600 my-4">
          Connect your Xero account to automatically sync invoices, bills, and contacts.
        </p>
        <button
          onClick={handleConnectXero}
          disabled={isLoading || !companyId}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Connect to Xero
        </button>
      </div>

      {/* --- QuickBooks Integration Card (New) --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center">
          {/* Using a generic logo as a placeholder */}
          <svg className="h-8 w-auto mr-4" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M22 44C34.1503 44 44 34.1503 44 22C44 9.84974 34.1503 0 22 0C9.84974 0 0 9.84974 0 22C0 34.1503 9.84974 44 22 44ZM24.2058 10.8571C24.2058 8.88301 22.518 7.33337 20.5713 7.33337C18.6246 7.33337 16.9368 8.88301 16.9368 10.8571V22.0001H10.5C8.55328 22.0001 7 23.5533 7 25.5001C7 27.4468 8.55328 29.0001 10.5 29.0001H16.9368V33.1429C16.9368 35.117 18.6246 36.6667 20.5713 36.6667C22.518 36.6667 24.2058 35.117 24.2058 33.1429V29.0001H33.5C35.4467 29.0001 37 27.4468 37 25.5001C37 23.5533 35.4467 22.0001 33.5 22.0001H24.2058V10.8571Z" fill="#2CA01C"/></svg>
          <h2 className="text-2xl font-semibold text-gray-700">QuickBooks</h2>
        </div>
        <p className="text-gray-600 my-4">
          Connect your QuickBooks Online account to keep your financial data in sync.
        </p>
        <button
          onClick={handleConnectQuickBooks}
          disabled={isLoading || !companyId}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Connect to QuickBooks
        </button>
      </div>

    </div>
  );
};

export default IntegrationSettings;
