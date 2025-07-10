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

  if (integrationData.status !== 'connected') {
    throw new Error(`Xero integration for companyId ${companyId} is not connected. Status: ${integrationData.status}`);
  }

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

  if (xero.readTokenSet().expired()) {
    console.log(`Token for company ${companyId} has expired. Refreshing...`);
    try {
      const newTokenSet = await xero.refreshToken();
      const newEncryptedAccessToken = await encryptWithKms(newTokenSet.access_token);
      const newEncryptedRefreshToken = await encryptWithKms(newTokenSet.refresh_token);

      await docRef.update({
        accessToken: newEncryptedAccessToken,
        refreshToken: newEncryptedRefreshToken,
        expiresAt: admin.firestore.Timestamp.fromMillis(newTokenSet.expires_at * 1000),
        status: "connected",
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Successfully refreshed and stored new token for company ${companyId}.`);
    } catch (err) {
      console.error(`Failed to refresh token for company ${companyId}. Marking as disconnected.`, err);
      await docRef.update({
        status: 'disconnected-requires-reauth',
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      throw new Error(`Xero token refresh failed for company ${companyId}. User must re-authenticate.`);
    }
  }

  await xero.updateTenants(false);
  const activeTenantId = integrationData.tenantId;
  if (!activeTenantId) {
    throw new Error(`Tenant ID is missing for companyId: ${companyId}`);
  }

  return { xero, tenantId: activeTenantId };
}


// ===================================================================
// 5. CALLABLE FUNCTION: provisionNewUser
// ===================================================================
exports.provisionNewUser = functions
 .region(region)
 .https.onCall(async (data, context) => {
    const { email, password, companyId, companyName } = data;
    if (!email || !password || !companyId || !companyName) {
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
// 6. HTTP FUNCTION: xeroAuth
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
    // =================================================================
    // === THE FIX IS HERE ===
    // For xero-node v13+, the state must be passed inside an object.
    // This ensures Xero sends the companyId back to our callback URL.
    // =================================================================
    const consentUrl = await xero.buildConsentUrl({ state: companyId });

    // Use res.json() which is idiomatic for sending JSON responses.
    res.json({ consentUrl });
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
    const params = new URLSearchParams(req.url.split('?')[1]);
    const companyId = params.get('state'); // Get state (companyId) from params

    if (!companyId) {
      console.error("Critical Error: State parameter (companyId) is missing from Xero callback URL.");
      return res.redirect(`${errorUrl}&error_description=State+parameter+missing`);
    }

    const xero = await initializeXeroClient();
    const tokenSet = await xero.apiCallback(req.url);

    await xero.updateTenants(false); // Pass false to prevent unnecessary token refresh checks
    const activeTenant = xero.tenants[0]; // Get the first tenant
    if (!activeTenant || !activeTenant.tenantId) {
      throw new Error("Could not retrieve an active tenant from Xero.");
    }
    const xeroTenantId = activeTenant.tenantId;

    const encryptedAccessToken = await encryptWithKms(tokenSet.access_token);
    const encryptedRefreshToken = await encryptWithKms(tokenSet.refresh_token);

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
// 7. HTTP FUNCTION: xeroWebhookHandler
// ===================================================================
const xeroWebhookApp = express();

xeroWebhookApp.post("/receive", express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookKey = await getSecret("XERO_WEBHOOK_KEY");
    const computedSignature = crypto
     .createHmac('sha256', webhookKey)
     .update(req.body)
     .digest('base64');
    const xeroSignature = req.headers['x-xero-signature'];

    if (xeroSignature && crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(xeroSignature))) {
      console.log("Webhook signature verified successfully.");
      res.status(200).send();
      const payload = JSON.parse(req.body.toString());
      await processWebhookPayload(payload);
    } else {
      console.error("Webhook signature validation failed!");
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    console.error("Error in webhook handler:", error);
    res.status(500).send("Internal Server Error");
  }
});

async function processWebhookPayload(payload) {
  if (payload.events && payload.events.length > 0) {
    console.log(`Processing ${payload.events.length} webhook events.`);
    for (const event of payload.events) {
      console.log(`Event: ${event.eventType} for tenant ${event.tenantId}, resourceId: ${event.resourceId}`);
    }
  }
}

exports.xeroWebhookHandler = functions.region(region).https.onRequest(xeroWebhookApp);


// ===================================================================
// 8. EXAMPLE API USAGE FUNCTION (Callable)
// ===================================================================
exports.syncXeroInvoices = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const companyId = data.companyId;
  if (!companyId) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "companyId".');
  }

  try {
    const { xero, tenantId } = await getAuthenticatedXeroClient(companyId);
    const whereFilter = 'Status=="AUTHORISED"';
    const response = await xero.accountingApi.getInvoices(tenantId, undefined, whereFilter);
    const invoices = response.body.invoices;
    console.log(`Found ${invoices.length} authorised invoices for company ${companyId}.`);

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
