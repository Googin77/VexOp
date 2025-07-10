// functions/index.cjs
// This is the complete and consolidated file for all your Cloud Functions.

// ===================================================================
// 1. IMPORTS & INITIALIZATION
// ===================================================================
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { XeroClient } = require("xero-node");
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

admin.initializeApp();
const db = admin.firestore();

// ===================================================================
// 2. SECRET MANAGEMENT UTILITY
// ===================================================================
const secretClient = new SecretManagerServiceClient();

async function getSecret(secretName) {
  const projectId = 'buildops-dashboard';
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  try {
    const [version] = await secretClient.accessSecretVersion({ name });
    // Trim any whitespace from the secret value.
    return version.payload.data.toString('utf8').trim();
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error);
    throw new Error(`Could not access secret: ${secretName}.`);
  }
}

// ===================================================================
// 3. CALLABLE FUNCTION: provisionNewUser
// This function is working correctly and remains unchanged.
// ===================================================================
exports.provisionNewUser = functions
  .region('australia-southeast1')
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
// 4. HTTP FUNCTION: xeroAuth (REWRITTEN FROM SCRATCH)
// This new version uses the simplest, most direct OAuth 2.0 flow.
// ===================================================================
const xeroAuthApp = express();
xeroAuthApp.use(cors({ origin: true }));

// This function initializes the Xero client. It will only run once.
const initializeXeroClient = async () => {
  const clientId = await getSecret("XERO_CLIENT_ID");
  const clientSecret = await getSecret("XERO_CLIENT_SECRET");
  const redirectUri = `https://australia-southeast1-buildops-dashboard.cloudfunctions.net/xeroAuth/callback`;
  return new XeroClient({
    clientId,
    clientSecret,
    redirectUris: [redirectUri],
    scopes: "openid profile email accounting.transactions accounting.settings offline_access".split(" "),
  });
};

// Route 1: /initiate
// Builds the consent URL and sends it to the frontend.
xeroAuthApp.get("/initiate", async (req, res) => {
  const companyId = req.query.companyId;
  if (!companyId) {
    return res.status(400).send("Company ID is required.");
  }
  try {
    const xero = await initializeXeroClient();
    const consentUrl = await xero.buildConsentUrl({ state: companyId });
    res.status(200).send({ consentUrl });
  } catch (error) {
    console.error("Error building Xero consent URL:", error);
    res.status(500).send("Failed to initiate Xero authentication.");
  }
});

// Route 2: /callback
// Handles the redirect from Xero after user grants consent.
xeroAuthApp.get("/callback", async (req, res) => {
  const successUrl = "https://vexop.com.au/client/settings/integrations?status=xero_success";
  const errorUrl = "https://vexop.com.au/client/settings/integrations?status=xero_error";

  try {
    const xero = await initializeXeroClient();
    const tokenSet = await xero.apiCallback(req.url);
    
    const companyId = tokenSet.state;
    if (!companyId) {
      // This error will now only happen if Xero truly fails to return the state.
      throw new Error("State parameter (companyId) is missing from callback.");
    }
    
    await xero.updateTenants();
    const xeroTenantId = xero.tenants[0].tenantId;

    const integrationData = {
      companyId: companyId,
      provider: "xero",
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(tokenSet.expires_at * 1000)),
      tenantId: xeroTenantId,
      scopes: tokenSet.scope.split(" "),
      status: "connected",
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = db.collection("integrations").doc(`${companyId}_xero`);
    await docRef.set(integrationData, { merge: true });

    res.redirect(successUrl);

  } catch (error) {
    console.error("Error in Xero callback handler:", error);
    res.redirect(errorUrl);
  }
});

exports.xeroAuth = functions.region('australia-southeast1').https.onRequest(xeroAuthApp);
