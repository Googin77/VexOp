// functions/index.cjs
// This is the complete and consolidated file for all your Cloud Functions.

// ===================================================================
// 1. IMPORTS & INITIALIZATION
// ===================================================================
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
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
    // --- THIS IS THE FIX ---
    // Use a regular expression to remove ALL whitespace characters (spaces, newlines, tabs, etc.)
    // from the secret to ensure it is perfectly clean.
    return secretValue.replace(/\s/g, '');
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error);
    throw new Error(`Could not access secret: ${secretName}.`);
  }
}

// ===================================================================
// 3. CALLABLE FUNCTION: provisionNewUser
// Replaces the old onCreate trigger. Allows an admin to create a new
// user and assign them to a specific company.
// ===================================================================
exports.provisionNewUser = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    // Optional: Add a check to ensure only authenticated admins can run this.
    // if (!context.auth || context.auth.token.role !== 'admin') {
    //   throw new functions.https.HttpsError('permission-denied', 'You must be an admin to perform this action.');
    // }

    const { email, password, companyId, companyName } = data;

    if (!email || !password || !companyId || !companyName) {
      throw new functions.https.HttpsError('invalid-argument', 'Request must include email, password, companyId, and companyName.');
    }

    try {
      // Step 1: Create the user in Firebase Authentication
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
      });
      const uid = userRecord.uid;
      console.log(`Successfully created new user in Auth: ${uid}`);

      // Step 2: Prepare a batch write to update Firestore atomically
      const batch = db.batch();

      // Step 3: Create the user document in the 'users1' collection to match your login logic
      const userRef = db.collection('users1').doc(uid);
      batch.set(userRef, {
        email: email,
        company: companyId, // Using 'company' to match your existing schema
        role: 'client'      // Setting the correct role for client dashboard access
      });

      // Step 4: Create or update the company document. Using merge prevents overwriting.
      const companyRef = db.collection('companies').doc(companyId);
      batch.set(companyRef, {
        companyName: companyName
      }, { merge: true });

      // Step 5: Create the placeholder integration documents for this company
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

      // Step 6: Commit all the changes to the database
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
// Handles the Xero OAuth 2.0 connection process.
// ===================================================================
const xeroAuthApp = express();
xeroAuthApp.use(cors({ origin: true }));
xeroAuthApp.use(cookieParser());

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
    const xeroClient = await initializeXeroClient();
    const consentUrl = await xeroClient.buildConsentUrl({ state: companyId });
    res.status(200).send({ consentUrl });
  } catch (error) {
    console.error("Error building Xero consent URL:", error);
    res.status(500).send("Failed to initiate Xero authentication.");
  }
});

xeroAuthApp.get("/handleXeroCallback", async (req, res) => {
  try {
    const xeroClient = await initializeXeroClient();
    const tokenSet = await xeroClient.apiCallback(req.url);
    const companyId = tokenSet.state;
    if (!companyId) {
      throw new Error("State parameter (companyId) is missing from callback.");
    }
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
    res.redirect("https://vexop.com.au/settings/integrations?status=xero_success");
  } catch (error) {
    console.error("Error in Xero callback handler:", error);
    res.status(500).redirect("https://vexop.com.au/settings/integrations?status=xero_error");
  }
});

exports.xeroAuth = functions.region('australia-southeast1').https.onRequest(xeroAuthApp);
