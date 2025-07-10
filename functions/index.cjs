// functions/index.cjs
// This is the complete and consolidated file for all your Cloud Functions.

// ===================================================================
// 1. IMPORTS & INITIALIZATION
// ===================================================================
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
// --- THIS IS THE FIX (Part 1) ---
// We need cookie-parser to manage the temporary cookie.
const cookieParser = require("cookie-parser");
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
    const secretValue = version.payload.data.toString('utf8');
    return secretValue.replace(/\s/g, '');
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error);
    throw new Error(`Could not access secret: ${secretName}.`);
  }
}

// ===================================================================
// 3. CALLABLE FUNCTION: provisionNewUser
// ===================================================================
exports.provisionNewUser = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    const { email, password, companyId, companyName } = data;

    if (!email || !password || !companyId || !companyName) {
      throw new functions.https.HttpsError('invalid-argument', 'Request must include email, password, companyId, and companyName.');
    }

    try {
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
      });
      const uid = userRecord.uid;
      console.log(`Successfully created new user in Auth: ${uid}`);

      const batch = db.batch();
      const userRef = db.collection('users1').doc(uid);
      batch.set(userRef, {
        email: email,
        company: companyId,
        role: 'client'
      });

      const companyRef = db.collection('companies').doc(companyId);
      batch.set(companyRef, {
        companyName: companyName
      }, { merge: true });

      const xeroRef = db.collection('integrations').doc(`${companyId}_xero`);
      batch.set(xeroRef, {
        companyId: companyId,
        provider: "xero",
        status: "disconnected",
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const myobRef = db.collection('integrations').doc(`${companyId}_myob`);
      batch.set(myobRef, {
        companyId: companyId,
        provider: "myob",
        status: "disconnected",
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
      console.log(`Successfully provisioned all documents for user ${uid} in company ${companyId}`);

      return { status: 'success', message: `User ${email} created successfully.`, uid: uid };

    } catch (error) {
      console.error('Error provisioning new user:', error);
      throw new functions.https.HttpsError('internal', 'An unexpected error occurred while creating the user.', error.message);
    }
  });


// ===================================================================
// 4. HTTP FUNCTION: xeroAuth
// ===================================================================
const xeroAuthApp = express();
xeroAuthApp.use(cors({ origin: true }));
xeroAuthApp.use(cookieParser()); // Use the cookie-parser middleware

let xero; 

async function initializeXeroClient() {
  if (xero) return xero;
  const clientId = await getSecret("XERO_CLIENT_ID");
  const clientSecret = await getSecret("XERO_CLIENT_SECRET");
  const redirectUri = `https://australia-southeast1-buildops-dashboard.cloudfunctions.net/xeroAuth/handleXeroCallback`;
  xero = new XeroClient({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUris: [redirectUri],
    scopes: "openid profile email accounting.transactions accounting.settings offline_access".split(" "),
  });
  return xero;
}

xeroAuthApp.get("/initiateXeroAuth", async (req, res) => {
  const companyId = req.query.companyId;
  if (!companyId) {
    return res.status(400).send("Error: Company ID is required.");
  }
  try {
    // --- THIS IS THE FIX (Part 2) ---
    // Set a secure, httpOnly cookie with the companyId. It will expire in 15 minutes.
    res.cookie('company_id', companyId, { maxAge: 900000, httpOnly: true, secure: true });

    const xeroClient = await initializeXeroClient();
    // We no longer need to pass state in the URL, but the SDK requires an object.
    const consentUrl = await xeroClient.buildConsentUrl();
    res.status(200).send({ consentUrl });
  } catch (error) {
    console.error("Error building Xero consent URL:", error);
    res.status(500).send("Failed to initiate Xero authentication.");
  }
});

xeroAuthApp.get("/handleXeroCallback", async (req, res) => {
  try {
    // --- THIS IS THE FIX (Part 3) ---
    // Read the companyId from the cookie instead of the URL state.
    const companyId = req.cookies.company_id;
    if (!companyId) {
      throw new Error("Company ID cookie not found. Please try the connection process again.");
    }

    const xeroClient = await initializeXeroClient();
    const tokenSet = await xeroClient.apiCallback(req.url);
    
    await xeroClient.updateTenants();
    const xeroTenantId = xeroClient.tenants[0].tenantId;
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

    const successUrl = "https://vexop.com.au/client/settings/integrations?status=xero_success";
    res.redirect(successUrl);

  } catch (error) {
    console.error("Error in Xero callback handler:", error);
    const errorUrl = "https://vexop.com.au/client/settings/integrations?status=xero_error";
    res.redirect(errorUrl);
  }
});

exports.xeroAuth = functions.region('australia-southeast1').https.onRequest(xeroAuthApp);
