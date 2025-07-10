import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Or your preferred notification library

/**
 * Handles the OAuth 2.0 callback from Xero.
 * Parses URL parameters, displays status to the user, and redirects to the settings page.
 */
export default function XeroCallbackHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('Finalizing Xero connection, please wait...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const errorDescription = params.get('error_description');

    if (status === 'xero_success') {
      toast.success('Successfully connected to Xero!');
      setMessage('Connection successful! Redirecting...');
    } else if (status === 'xero_error') {
      const displayError = errorDescription | 'An unknown error occurred.';
      toast.error(`Xero connection failed: ${displayError}`);
      setMessage('Connection failed. Please try again.');
    } else {
      // This case handles unexpected navigation to this page.
      toast.warn('Invalid callback state. Redirecting...');
      setMessage('Invalid callback state. Redirecting...');
    }

    // Redirect the user back to the main integrations settings page after a short delay.
    // The `replace: true` option prevents this callback URL from being in the browser history.
    const timer = setTimeout(() => {
      navigate('/client/settings/integrations', { replace: true });
    }, 3000); // 3-second delay

    return () => clearTimeout(timer); // Cleanup timer on component unmount

  }, [location, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      {/* You can add a loading spinner component here for better UX */}
      <h2 style={{ marginBottom: '20px' }}>{message}</h2>
      <p>You will be redirected shortly.</p>
    </div>
  );
}
