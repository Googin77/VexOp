// ===================================================================
// 1. IMPORTS & INITIALIZATION
// ===================================================================
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { v4: uuidv4 } = require('uuid');
const { URLSearchParams } = require('url');
const { XeroClient } = require("xero-node");
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { KeyManagementServiceClient } = require('@google-cloud/kms');

admin.initializeApp();
const db = admin.firestore();

// ===================================================================
// 2. CONFIGURATION & CLIENTS
// ===================================================================
const projectId = 'buildops-dashboard'; // Your GCP Project ID
const region = 'australia-southeast1';

// --- Secret Manager Client ---
const secretClient = new SecretManagerServiceClient();

// --- KMS Client & Key Path ---
// IMPORTANT: Create this KeyRing and Key in the Google Cloud Console.
const kmsClient = new KeyManagementServiceClient();
const kmsKeyPath = kmsClient.cryptoKeyPath(
  projectId,
  region,
  'xero-integration-keyring', // A name for your key ring
  'xero-token-key'            // A name for your symmetric key
);

// ===================================================================
// 3. UTILITY FUNCTIONS
// ===================================================================

/**
 * Retrieves a secret value from Google Cloud Secret Manager.
 * @param {string} secretName The name of the secret to retrieve.
 * @returns {Promise<string>} The secret value.
 */
async function getSecret(secretName) {
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  try {
    const [version] = await secretClient.accessSecretVersion({ name });
    return version.payload.data.toString('utf8').trim();
  } catch (error) {
    console.error(`FATAL: Error accessing secret ${secretName}:`, error);
    throw new Error(`Could not access secret: ${secretName}.`);
  }
}

/**
 * Encrypts plaintext using Google Cloud KMS.
 * @param {string} plaintext The text to encrypt.
 * @returns {Promise<string|null>} Base64 encoded ciphertext.
 */
async function encryptWithKms(plaintext) {
  if (!plaintext) return null;
  const plaintextBuffer = Buffer.from(plaintext, 'utf8');
  try {
    const [result] = await kmsClient.encrypt({
      name: kmsKeyPath,
      plaintext: plaintextBuffer,
    });
    return result.ciphertext.toString('base64');
  } catch (error) {
    console.error('KMS Encryption failed:', error);
    throw new Error('Failed to encrypt data.');
  }
}

/**
 * Decrypts ciphertext using Google Cloud KMS.
 * @param {string} ciphertext The base64 encoded text to decrypt.
 * @returns {Promise<string|null>} The decrypted plaintext.
 */
async function decryptWithKms(ciphertext) {
  if (!ciphertext) return null;
  const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
  try {
    const [result] = await kmsClient.decrypt({
      name: kmsKeyPath,
      ciphertext: ciphertextBuffer,
    });
    return result.plaintext.toString('utf8');
  } catch (error) {
    console.error('KMS Decryption failed:', error);
    throw new Error('Failed to decrypt data.');
  }
}

/**
 * Initializes a new, stateless Xero client instance.
 * @returns {Promise<XeroClient>} A new XeroClient instance.
 */
const initializeXeroClient = async () => {
  const clientId = await getSecret("XERO_CLIENT_ID");
  const clientSecret = await getSecret("XERO_CLIENT_SECRET");
  const redirectUri = `https://${region}-${projectId}.cloudfunctions.net/xeroAuth/callback`;

  return new XeroClient({
    clientId,
    clientSecret,
    redirectUris: [redirectUri],
    scopes: "openid profile email accounting.transactions accounting.settings offline_access".split(" "),
  });
};

// ===================================================================
// 4. PRODUCTION-GRADE XERO CLIENT FACTORY
// Use this function for ALL authenticated API calls to Xero.
// ===================================================================

/**
 * Provides a fully authenticated Xero client, handling token refresh automatically.
 * @param {string} companyId The company ID to get a client for.
 * @returns {Promise<{xero: XeroClient, tenantId: string}>} An object with the authenticated client and tenant ID.
 */
async function getAuthenticatedXeroClient(companyId) {
  const docRef = db.collection("integrations").doc(`${companyId}_xero`);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new Error(`No Xero integration found for companyId: ${companyId}`);
  }

  const integrationData = docSnap.data();

  if (integrationData.status!== 'connected') {
    throw new Error(`Xero integration for companyId ${companyId} is not connected. Status: ${integrationData.status}`);
  }

  // 1. Decrypt the stored tokens.
  const accessToken = await decryptWithKms(integrationData.accessToken);
  const refreshToken = await decryptWithKms(integrationData.refreshToken);

  const tokenSet = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: integrationData.expiresAt.toMillis() / 1000,
    scope: integrationData.scopes,
  };

  const xero = await initializeXeroClient();
  xero.setTokenSet(tokenSet);

  // 2. Check if the token is expired (or close to it).
  if (xero.readTokenSet().expired()) {
    console.log(`Token for company ${companyId} has expired. Refreshing...`);
    try {
      // 3. Refresh the token set.
      const newTokenSet = await xero.refreshToken();

      // 4. Encrypt the new tokens for secure storage.
      const newEncryptedAccessToken = await encryptWithKms(newTokenSet.access_token);
      const newEncryptedRefreshToken = await encryptWithKms(newTokenSet.refresh_token);

      // 5. Atomically update Firestore with the new, encrypted tokens and expiry.
      await docRef.update({
        accessToken: newEncryptedAccessToken,
        refreshToken: newEncryptedRefreshToken,
        expiresAt: admin.firestore.Timestamp.fromMillis(newTokenSet.expires_at * 1000),
        status: "connected", // Ensure status is connected after a successful refresh
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Successfully refreshed and stored new token for company ${companyId}.`);
    } catch (err) {
      console.error(`Failed to refresh token for company ${companyId}. Marking as disconnected.`, err);
      // If refresh fails (e.g., invalid_grant), the connection is broken.
      await docRef.update({
        status: 'disconnected-requires-reauth',
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      throw new Error(`Xero token refresh failed for company ${companyId}. User must re-authenticate.`);
    }
  }

  // 6. Ensure tenants are populated on the client instance.
  await xero.updateTenants(false);

  // 7. Return the ready-to-use client and the active tenantId.
  const activeTenantId = integrationData.tenantId;
  if (!activeTenantId) {
    throw new Error(`Tenant ID is missing for companyId: ${companyId}`);
  }

  return { xero, tenantId: activeTenantId };
}


// ===================================================================
// 5. CALLABLE FUNCTION: provisionNewUser (Unchanged)
// ===================================================================
exports.provisionNewUser = functions
 .region(region)
 .https.onCall(async (data, context) => {
    const { email, password, companyId, companyName } = data;
    if (!email ||!password ||!companyId ||!companyName) {
      throw new functions.https.HttpsError('invalid-argument', 'Request must include email, password, companyId, and companyName.');
    }
    try {
      const userRecord = await admin.auth().createUser({ email, password });
      const uid = userRecord.uid;
      const batch = db.batch();
      const userRef = db.collection('users1').doc(uid);
      batch.set(userRef, { email, company: companyId, role: 'client' });
      const companyRef = db.collection('companies').doc(companyId);
      batch.set(companyRef, { companyName }, { merge: true });
      const xeroRef = db.collection('integrations').doc(`${companyId}_xero`);
      batch.set(xeroRef, { companyId, provider: "xero", status: "disconnected", lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp() });
      const myobRef = db.collection('integrations').doc(`${companyId}_myob`);
      batch.set(myobRef, { companyId, provider: "myob", status: "disconnected", lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp() });
      await batch.commit();
      return { status: 'success', message: `User ${email} created successfully.`, uid: uid };
    } catch (error) {
      console.error('Error provisioning new user:', error);
      throw new functions.https.HttpsError('internal', 'An unexpected error occurred.', error.message);
    }
  });


// ===================================================================
// 6. HTTP FUNCTION: xeroAuth (Corrected & Hardened)
// ===================================================================
const xeroAuthApp = express();
xeroAuthApp.use(cors({ origin: true }));

// --- Route 1: /initiate ---
xeroAuthApp.get("/initiate", async (req, res) => {
  const companyId = req.query.companyId;
  if (!companyId) {
    return res.status(400).send("Bad Request: Company ID is required.");
  }

  try {
    const xero = await initializeXeroClient();
    const consentUrl = await xero.buildConsentUrl({ state: companyId });
    res.status(200).send({ consentUrl });
  } catch (error) {
    console.error("Error building Xero consent URL:", error);
    res.status(500).send("Internal Server Error: Failed to initiate Xero authentication.");
  }
});

// --- Route 2: /callback ---
xeroAuthApp.get("/callback", async (req, res) => {
  const successUrl = "https://vexop.com.au/client/settings/integrations?status=xero_success";
  const errorUrl = "https://vexop.com.au/client/settings/integrations?status=xero_error";
  const genericErrorMessage = "An unexpected error occurred during Xero authentication.";

  try {
    // 1. Explicitly parse state (companyId) from the request URL.
    const params = new URLSearchParams(req.url.split('?')[1]);
    const code = params.get('code');
    const companyId = params.get('state');

    // 2. Validate the state parameter immediately.
    if (!companyId) {
      console.error("Critical Error: State parameter (companyId) is missing from Xero callback URL.");
      return res.redirect(`${errorUrl}&error_description=State+parameter+missing`);
    }

    // 3. Initialize client and perform code exchange.
    const xero = await initializeXeroClient();
    const tokenSet = await xero.apiCallback(req.url);

    // 4. Get the active tenant.
    await xero.updateTenants();
    const activeTenant = xero.tenants;
    if (!activeTenant ||!activeTenant.tenantId) {
      throw new Error("Could not retrieve an active tenant from Xero.");
    }
    const xeroTenantId = activeTenant.tenantId;

    // 5. Encrypt sensitive tokens before storage.
    const encryptedAccessToken = await encryptWithKms(tokenSet.access_token);
    const encryptedRefreshToken = await encryptWithKms(tokenSet.refresh_token);

    // 6. Prepare the data for Firestore.
    const integrationData = {
      companyId: companyId,
      provider: "xero",
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: admin.firestore.Timestamp.fromMillis(tokenSet.expires_at * 1000),
      tenantId: xeroTenantId,
      tenantName: activeTenant.tenantName,
      scopes: tokenSet.scope,
      status: "connected",
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 7. Atomically write the integration data to Firestore.
    const docRef = db.collection("integrations").doc(`${companyId}_xero`);
    await docRef.set(integrationData, { merge: true });

    res.redirect(successUrl);

  } catch (error) {
    console.error("Error in Xero callback handler:", error.message);
    res.redirect(`${errorUrl}&error_description=${encodeURIComponent(genericErrorMessage)}`);
  }
});

exports.xeroAuth = functions.region(region).https.onRequest(xeroAuthApp);


// ===================================================================
// 7. HTTP FUNCTION: xeroWebhookHandler (New & Secure)
// ===================================================================
const xeroWebhookApp = express();

// --- Route: /receive ---
// IMPORTANT: Use express.raw() ONLY for the webhook route to get the raw body for signature verification.
xeroWebhookApp.post("/receive", express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookKey = await getSecret("XERO_WEBHOOK_KEY");

    // 1. Compute our own signature from the raw request body.
    const computedSignature = crypto
     .createHmac('sha256', webhookKey)
     .update(req.body) // req.body is a Buffer here
     .digest('base64');

    // 2. Get the signature from the Xero request header.
    const xeroSignature = req.headers['x-xero-signature'];

    // 3. Securely compare the signatures.
    if (xeroSignature && crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(xeroSignature))) {
      console.log("Webhook signature verified successfully.");

      // 4. Acknowledge receipt immediately with a 200 OK to prevent Xero from retrying.
      res.status(200).send();

      // 5. Process the payload asynchronously to avoid timeouts.
      // For a production system, you would enqueue this payload into Cloud Tasks or Pub/Sub.
      const payload = JSON.parse(req.body.toString());
      await processWebhookPayload(payload);

    } else {
      // Signature is invalid. Reject the request.
      console.error("Webhook signature validation failed!");
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    console.error("Error in webhook handler:", error);
    // Send a generic error response. Avoid sending detailed errors back.
    res.status(500).send("Internal Server Error");
  }
});

/**
 * Asynchronously processes the webhook payload.
 * @param {object} payload The parsed JSON payload from the webhook.
 */
async function processWebhookPayload(payload) {
  // Example: Log the events. In a real app, you would use these events
  // to trigger data syncs or other business logic.
  if (payload.events && payload.events.length > 0) {
    console.log(`Processing ${payload.events.length} webhook events.`);
    for (const event of payload.events) {
      console.log(`Event: ${event.eventType} for tenant ${event.tenantId}, resourceId: ${event.resourceId}`);
      // Example: If an invoice is updated, you might fetch it and update your system.
      // const { xero, tenantId } = await getAuthenticatedXeroClient(event.tenantId);
      // const updatedInvoice = await xero.accountingApi.getInvoice(tenantId, event.resourceId);
      //... your logic to update your database...
    }
  }
}

exports.xeroWebhookHandler = functions.region(region).https.onRequest(xeroWebhookApp);


// ===================================================================
// 8. EXAMPLE API USAGE FUNCTION (Callable)
// Demonstrates how to use getAuthenticatedXeroClient for API calls.
// ===================================================================
exports.syncXeroInvoices = functions.region(region).https.onCall(async (data, context) => {
  // Authenticate the user making the call
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const companyId = data.companyId;
  if (!companyId) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "companyId".');
  }

  try {
    // 1. Get the authenticated client. All token logic is handled for you.
    const { xero, tenantId } = await getAuthenticatedXeroClient(companyId);

    // 2. Make the API call.
    const whereFilter = 'Status=="AUTHORISED"';
    const response = await xero.accountingApi.getInvoices(tenantId, undefined, whereFilter);

    const invoices = response.body.invoices;
    console.log(`Found ${invoices.length} authorised invoices for company ${companyId}.`);

    // 3. Return the result to the client.
    // (In a real app, you would likely sync this data to your own Firestore database).
    return {
      status: 'success',
      invoiceCount: invoices.length,
      invoices: invoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        contact: inv.contact.name,
        amountDue: inv.amountDue,
        dueDate: inv.dueDateString
      }))
    };
  } catch (error) {
    console.error(`Failed to sync invoices for company ${companyId}:`, error);
    throw new functions.https.HttpsError('internal', 'Failed to sync Xero invoices.', error.message);
  }
});
