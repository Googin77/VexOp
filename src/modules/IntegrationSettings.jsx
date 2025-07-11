// src/modules/IntegrationSettings.jsx

import React, { useState, useEffect, useContext } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { db } from '../firebase';
import { AuthContext } from '../AuthContext';
import { toast } from 'react-toastify';

// Initialize Firebase Functions
const functions = getFunctions(getApp(), 'australia-southeast1');
const syncQuickBooksData = httpsCallable(functions, 'syncQuickBooksData');
const createQuickBooksCustomer = httpsCallable(functions, 'createQuickBooksCustomer');

const IntegrationSettings = () => {
  const { currentUser } = useContext(AuthContext);
  const [companyId, setCompanyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for API Data
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [syncedInvoices, setSyncedInvoices] = useState([]);
  const [newCustomerName, setNewCustomerName] = useState('');

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

  // --- QuickBooks Connection Handler ---
  const handleConnectQuickBooks = async () => {
    if (!companyId) {
      toast.error('Company information is missing. Cannot connect to QuickBooks.');
      return;
    }
    toast.info("Preparing to connect to QuickBooks...");
    try {
      const functionBaseUrl = 'https://australia-southeast1-buildops-dashboard.cloudfunctions.net';
      const cacheBuster = new Date().getTime();
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

    // --- Handler to READ data from QuickBooks ---
    const handleSyncQuickBooks = async () => {
      if (!companyId) return toast.error('Company ID not found.');
      setIsSyncing(true);
      setSyncedInvoices([]);
      toast.info("Fetching recent invoices from QuickBooks...");
      try {
        const result = await syncQuickBooksData({ companyId });
        if (result.data.status === 'success') {
          setSyncedInvoices(result.data.invoices || []);
          toast.success(`Successfully synced ${result.data.invoices?.length || 0} invoices!`);
        } else {
          throw new Error('Sync failed with an unknown status.');
        }
      } catch (error) {
        console.error("Error syncing QuickBooks data:", error);
        toast.error(`Sync failed: ${error.message}`);
      } finally {
        setIsSyncing(false);
      }
    };

    // --- Handler to WRITE data to QuickBooks ---
    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        if (!companyId) return toast.error('Company ID not found.');
        if (!newCustomerName.trim()) return toast.error('Please enter a customer name.');
        setIsCreating(true);
        toast.info(`Creating customer "${newCustomerName}" in QuickBooks...`);
        const customerData = {
            DisplayName: newCustomerName.trim(),
            PrimaryEmailAddr: { Address: "example@vexop.com.au" },
            PrimaryPhone: { FreeFormNumber: "0400123456" }
        };
        try {
            const result = await createQuickBooksCustomer({ companyId, customerData });
            if (result.data.status === 'success') {
                toast.success(`Successfully created customer: ${result.data.customer.DisplayName}`);
                setNewCustomerName('');
            }
        } catch (error) {
            console.error("Error creating QuickBooks customer:", error);
            toast.error(`Creation failed: ${error.message}`);
        } finally {
            setIsCreating(false);
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

      {/* --- QuickBooks Integration Card --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center">
          <svg className="h-8 w-auto mr-4" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M22 44C34.1503 44 44 34.1503 44 22C44 9.84974 34.1503 0 22 0C9.84974 0 0 9.84974 0 22C0 34.1503 9.84974 44 22 44ZM24.2058 10.8571C24.2058 8.88301 22.518 7.33337 20.5713 7.33337C18.6246 7.33337 16.9368 8.88301 16.9368 10.8571V22.0001H10.5C8.55328 22.0001 7 23.5533 7 25.5001C7 27.4468 8.55328 29.0001 10.5 29.0001H16.9368V33.1429C16.9368 35.117 18.6246 36.6667 20.5713 36.6667C22.518 36.6667 24.2058 35.117 24.2058 33.1429V29.0001H33.5C35.4467 29.0001 37 27.4468 37 25.5001C37 23.5533 35.4467 22.0001 33.5 22.0001H24.2058V10.8571Z" fill="#2CA01C"/></svg>
          <h2 className="text-2xl font-semibold text-gray-700">QuickBooks</h2>
        </div>
        <p className="text-gray-600 my-4">
          Connect your QuickBooks Online account to sync data and perform actions.
        </p>
        <div className="flex items-center space-x-4 mb-6">
            <button
                onClick={handleConnectQuickBooks}
                disabled={isLoading || !companyId}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                Connect to QuickBooks
            </button>
        </div>

        {/* --- Actions and Data Display Section --- */}
        <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* READ DATA */}
                <div>
                    <p className="font-medium text-gray-800">Read Data from QuickBooks</p>
                    <p className="text-sm text-gray-500 mb-2">Fetch the 15 most recent invoices.</p>
                    <button
                        onClick={handleSyncQuickBooks}
                        disabled={isSyncing || !companyId}
                        className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400">
                        {isSyncing ? 'Syncing...' : 'Sync Recent Invoices'}
                    </button>
                </div>

                {/* WRITE DATA */}
                <div>
                    <p className="font-medium text-gray-800">Write Data to QuickBooks</p>
                    <p className="text-sm text-gray-500 mb-2">Create a new customer.</p>
                    <form onSubmit={handleCreateCustomer} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            placeholder="New Customer Name"
                            className="p-2 border rounded-md w-full"
                            disabled={isCreating}
                        />
                        <button
                            type="submit"
                            disabled={isCreating || !companyId}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400">
                            {isCreating ? '...' : 'Create'}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {/* --- Data Display Area --- */}
        {syncedInvoices.length > 0 && (
            <div className="mt-6 border-t pt-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Recently Synced Invoices</h3>
                <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-md">
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                        {syncedInvoices.map(invoice => (
                            <li key={invoice.Id} className="text-sm">
                                Invoice <span className="font-medium">{invoice.DocNumber || 'N/A'}</span> for <span className="font-medium">{invoice.TotalAmt} {invoice.CurrencyRef.value}</span> to <span className="font-medium">{invoice.CustomerRef.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default IntegrationSettings;