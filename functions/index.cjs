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

// --- Provider SDKs ---
const { XeroClient } = require("xero-node");
const QuickBooks = require("node-quickbooks");
const axios = require("axios");

// --- Google Cloud Services ---
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { KeyManagementServiceClient } = require('@google-cloud/kms');

admin.initializeApp();
const db = admin.firestore();

// ===================================================================
// 2. CONFIGURATION & CLIENTS
// ===================================================================
const projectId = 'buildops-dashboard';
const region = 'australia-southeast1';

const secretClient = new SecretManagerServiceClient();
const kmsClient = new KeyManagementServiceClient();

// KMS key paths for each integration
const kmsXeroKeyPath = kmsClient.cryptoKeyPath(
  projectId,
  region,
  'xero-integration-keyring',
  'xero-token-key'
);
const kmsQuickBooksKeyPath = kmsClient.cryptoKeyPath(
  projectId,
  region,
  'quickbooks-integration-keyring',
  'quickbooks-token-key'
);


// ===================================================================
// 3. UTILITY FUNCTIONS
// ===================================================================
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

async function encryptWithKms(plaintext, keyPath) {
  if (!plaintext) return null;
  const plaintextBuffer = Buffer.from(plaintext, 'utf8');
  try {
    const [result] = await kmsClient.encrypt({ name: keyPath, plaintext: plaintextBuffer });
    return result.ciphertext.toString('base64');
  } catch (error) {
    console.error('KMS Encryption failed:', error);
    throw new Error('Failed to encrypt data.');
  }
}

async function decryptWithKms(ciphertext, keyPath) {
  if (!ciphertext) return null;
  const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
  try {
    const [result] = await kmsClient.decrypt({ name: keyPath, ciphertext: ciphertextBuffer });
    return result.plaintext.toString('utf8');
  } catch (error) {
    console.error('KMS Decryption failed:', error);
    throw new Error('Failed to decrypt data.');
  }
}

// ===================================================================
// 4. XERO-SPECIFIC LOGIC
// ===================================================================
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
    const accessToken = await decryptWithKms(integrationData.accessToken, kmsXeroKeyPath);
    const refreshToken = await decryptWithKms(integrationData.refreshToken, kmsXeroKeyPath);
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
        const newEncryptedAccessToken = await encryptWithKms(newTokenSet.access_token, kmsXeroKeyPath);
        const newEncryptedRefreshToken = await encryptWithKms(newTokenSet.refresh_token, kmsXeroKeyPath);
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
      
      const quickbooksRef = db.collection('integrations').doc(`${companyId}_quickbooks`);
      batch.set(quickbooksRef, { companyId, provider: "quickbooks", status: "disconnected", lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp() });
      
      await batch.commit();
      return { status: 'success', message: `User ${email} created successfully.`, uid: uid };
    } catch (error) {
      console.error('Error provisioning new user:', error);
      throw new functions.https.HttpsError('internal', 'An unexpected error occurred.', error.message);
    }
});

const xeroAuthApp = express();
xeroAuthApp.use(cors({ origin: true }));
xeroAuthApp.get("/initiate", async (req, res) => {
  const companyId = req.query.companyId;
  if (!companyId) {
    return res.status(400).send("Bad Request: Company ID is required.");
  }
  try {
    const xero = await initializeXeroClient();
    const consentUrl = await xero.buildConsentUrl({ state: companyId });
    res.json({ consentUrl });
  } catch (error) {
    console.error("Error building Xero consent URL:", error);
    res.status(500).send("Internal Server Error: Failed to initiate Xero authentication.");
  }
});
xeroAuthApp.get("/callback", async (req, res) => {
  const successUrl = "https://vexop.com.au/client/settings/integrations?status=xero_success";
  const errorUrl = "https://vexop.com.au/client/settings/integrations?status=xero_error";
  const genericErrorMessage = "An unexpected error occurred during Xero authentication.";
  try {
    const params = new URLSearchParams(req.url.split('?')[1]);
    const companyId = params.get('state');
    if (!companyId) {
      console.error("Critical Error: State parameter (companyId) is missing from Xero callback URL.");
      return res.redirect(`${errorUrl}&error_description=State+parameter+missing`);
    }
    const xero = await initializeXeroClient();
    const tokenSet = await xero.apiCallback(req.url);
    await xero.updateTenants(false);
    const activeTenant = xero.tenants[0];
    if (!activeTenant || !activeTenant.tenantId) {
      throw new Error("Could not retrieve an active tenant from Xero.");
    }
    const xeroTenantId = activeTenant.tenantId;
    const encryptedAccessToken = await encryptWithKms(tokenSet.access_token, kmsXeroKeyPath);
    const encryptedRefreshToken = await encryptWithKms(tokenSet.refresh_token, kmsXeroKeyPath);
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

// ===================================================================
// 6. QUICKBOOKS-SPECIFIC LOGIC
// ===================================================================
const quickbooksAuthApp = express();
quickbooksAuthApp.use(cors({ origin: true }));

// --- Route 1: /initiate ---
quickbooksAuthApp.get("/initiate", async (req, res) => {
  const companyId = req.query.companyId;
  if (!companyId) {
    return res.status(400).send("Bad Request: Company ID is required.");
  }
  try {
    const clientId = await getSecret("QUICKBOOKS_CLIENT_ID");
    const redirectUri = `https://${region}-${projectId}.cloudfunctions.net/quickbooksAuth/callback`;
    const scope = 'com.intuit.quickbooks.accounting';
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: scope,
      redirect_uri: redirectUri,
      state: companyId,
    });
    const authUri = `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
    res.json({ consentUrl: authUri });
  } catch (error) {
    console.error("CRITICAL ERROR in /initiate:", error.message);
    res.status(500).send("Internal Server Error: Failed to initiate QuickBooks authentication.");
  }
});

// --- Route 2: /callback ---
quickbooksAuthApp.get("/callback", async (req, res) => {
  const successUrl = "https://vexop.com.au/client/settings/integrations?status=quickbooks_success";
  const errorUrl = "https://vexop.com.au/client/settings/integrations?status=quickbooks_error";
  try {
    const companyId = req.query.state;
    const realmId = req.query.realmId;
    const authCode = req.query.code;
    if (!companyId || !realmId || !authCode) {
      throw new Error("Required parameters (state, realmId, or code) are missing from the QuickBooks callback.");
    }
    const clientId = await getSecret("QUICKBOOKS_CLIENT_ID");
    const clientSecret = await getSecret("QUICKBOOKS_CLIENT_SECRET");
    const redirectUri = `https://${region}-${projectId}.cloudfunctions.net/quickbooksAuth/callback`;
    const authHeader = 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64');
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: redirectUri,
    });
    const tokenResponse = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      requestBody.toString(),
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader,
        },
      }
    );
    const tokenSet = tokenResponse.data;
    const encryptedAccessToken = await encryptWithKms(tokenSet.access_token, kmsQuickBooksKeyPath);
    const encryptedRefreshToken = await encryptWithKms(tokenSet.refresh_token, kmsQuickBooksKeyPath);
    const integrationData = {
      companyId: companyId,
      provider: "quickbooks",
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (tokenSet.expires_in * 1000)),
      tenantId: realmId,
      scopes: tokenSet.scope ? tokenSet.scope.split(" ") : [],
      status: "connected",
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = db.collection("integrations").doc(`${companyId}_quickbooks`);
    await docRef.set(integrationData, { merge: true });
    res.redirect(successUrl);
  } catch (error) {
    console.error("Error in QuickBooks callback handler:", error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.error_description || "An unexpected error occurred.";
    res.redirect(`${errorUrl}&error_description=${encodeURIComponent(errorMessage)}`);
  }
});
exports.quickbooksAuth = functions.region(region).https.onRequest(quickbooksAuthApp);

// --- NEW: QuickBooks Authenticated Client Factory ---
async function getAuthenticatedQuickBooksClient(companyId) {
    const docRef = db.collection("integrations").doc(`${companyId}_quickbooks`);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data().status !== 'connected') {
        throw new functions.https.HttpsError('failed-precondition', `QuickBooks integration not found or not connected for companyId: ${companyId}`);
    }
    const integrationData = docSnap.data();
    const accessToken = await decryptWithKms(integrationData.accessToken, kmsQuickBooksKeyPath);
    const refreshToken = await decryptWithKms(integrationData.refreshToken, kmsQuickBooksKeyPath);
    const realmId = integrationData.tenantId;
    if (!accessToken || !refreshToken || !realmId) {
        throw new functions.https.HttpsError('internal', 'Stored token data is incomplete.');
    }
    const qbo = new QuickBooks(
        await getSecret("QUICKBOOKS_CLIENT_ID"),
        await getSecret("QUICKBOOKS_CLIENT_SECRET"),
        accessToken,
        false,
        realmId,
        true, // use sandbox
        false, // debugging
        null,
        '2.0',
        refreshToken
    );
    qbo.on('tokenRefreshed', async (newTokenData) => {
        console.log(`Refreshing QuickBooks token for company ${companyId}...`);
        const newEncryptedAccessToken = await encryptWithKms(newTokenData.access_token, kmsQuickBooksKeyPath);
        const newEncryptedRefreshToken = await encryptWithKms(newTokenData.refresh_token, kmsQuickBooksKeyPath);
        await docRef.update({
            accessToken: newEncryptedAccessToken,
            refreshToken: newEncryptedRefreshToken,
            expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (newTokenData.expires_in * 1000)),
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Successfully saved refreshed QuickBooks token for company ${companyId}.`);
    });
    return qbo;
}

// --- NEW: Callable Function to READ Data from QuickBooks ---
exports.syncQuickBooksData = functions.region(region).runWith({
    secrets: ["QUICKBOOKS_CLIENT_ID", "QUICKBOOKS_CLIENT_SECRET", "KMS_KEY_ID", "KMS_KEY_RING_ID"],
}).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { companyId } = data;
    if (!companyId) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "companyId".');
    }
    try {
        const qbo = await getAuthenticatedQuickBooksClient(companyId);
        const findInvoices = () => new Promise((resolve, reject) => {
            qbo.findInvoices({
                limit: 15,
                offset: 1,
                sort: 'TxnDate DESC'
            }, (err, invoices) => {
                if (err) return reject(err);
                resolve(invoices);
            });
        });
        const invoiceResponse = await findInvoices();
        console.log(`Found ${invoiceResponse.QueryResponse.Invoice.length} invoices for company ${companyId}.`);
        return {
            status: 'success',
            invoices: invoiceResponse.QueryResponse.Invoice
        };
    } catch (error) {
        console.error(`Failed to sync QuickBooks data for company ${companyId}:`, error);
        throw new functions.https.HttpsError('internal', 'Failed to sync QuickBooks data.', error.message);
    }
});

// --- NEW: Callable Function to WRITE Data to QuickBooks ---
exports.createQuickBooksCustomer = functions.region(region).runWith({
    secrets: ["QUICKBOOKS_CLIENT_ID", "QUICKBOOKS_CLIENT_SECRET", "KMS_KEY_ID", "KMS_KEY_RING_ID"],
}).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { companyId, customerData } = data;
    if (!companyId || !customerData || !customerData.DisplayName) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing "companyId" or "customerData".');
    }
    try {
        const qbo = await getAuthenticatedQuickBooksClient(companyId);
        const createCustomer = () => new Promise((resolve, reject) => {
            qbo.createCustomer(customerData, (err, customer) => {
                if (err) {
                    const detail = err.Fault?.Error?.[0]?.Detail || 'Unknown error.';
                    console.error("QuickBooks Create Customer Error:", detail);
                    return reject(new functions.https.HttpsError('internal', `Failed to create customer: ${detail}`));
                }
                resolve(customer);
            });
        });
        const newCustomer = await createCustomer();
        console.log(`Successfully created customer "${newCustomer.DisplayName}" for company ${companyId}.`);
        return {
            status: 'success',
            customer: newCustomer
        };
    } catch (error) {
        console.error(`Failed to create QuickBooks customer for company ${companyId}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred while creating the customer.');
    }
});