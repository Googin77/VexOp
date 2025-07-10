// src/utils/secrets.js

// Import the official Google Secret Manager client library
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Initialize the client
const client = new SecretManagerServiceClient();

/**
 * Fetches the value of a secret from Google Cloud Secret Manager.
 * This is designed to be used within your Google Cloud Functions.
 * @param {string} secretName The short name of the secret to fetch (e.g., 'XERO_CLIENT_ID').
 * @returns {Promise<string>} The secret's value as a string.
 */
async function getSecret(secretName) {
  // Your Google Cloud project ID from firebase.js
  const projectId = 'buildops-dashboard'; 

  // Construct the full resource name of the secret's latest version
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  try {
    // Access the secret version
    const [version] = await client.accessSecretVersion({ name });

    // The secret data is a "buffer" and needs to be converted to a readable string
    const secretValue = version.payload.data.toString('utf8');
    return secretValue;

  } catch (error) {
    console.error(`Error accessing secret '${secretName}':`, error);
    // In a real-world function, you might want to handle this error more gracefully
    throw new Error(`Could not access secret: ${secretName}.`);
  }
}

// Export the function to make it available to your Cloud Functions
module.exports = { getSecret };