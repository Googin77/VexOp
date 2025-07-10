// migrateUsers.js
import admin from 'firebase-admin';

// The SDK will automatically find your gcloud credentials.
admin.initializeApp({
  projectId: 'buildops-dashboard' 
});

const db = admin.firestore();

async function migrateUsersToIntegrations() {
  console.log('Starting migration with your user credentials...');

  const usersSnapshot = await db.collection('users1').get();
  
  if (usersSnapshot.empty) {
    console.log('No users found in "users1" collection. Nothing to migrate.');
    return;
  }

  const batch = db.batch();

  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    const userId = doc.id;
    const companyId = userData.company;

    if (!companyId) {
      console.warn(`User with ID ${userId} is missing a companyId. Skipping.`);
      return;
    }

    console.log(`Preparing migration for user ${userId} in company ${companyId}.`);

    const integrationDocRef = db.collection('integrations').doc(`${companyId}_xero`);
    
    const integrationData = {
      companyId: companyId,
      provider: "xero",
      accessToken: "",
      refreshToken: "",
      expiresAt: new Date(),
      tenantId: "",
      scopes: [],
      status: "disconnected",
      lastUpdatedAt: new Date()
    };
    
    batch.set(integrationDocRef, integrationData, { merge: true });
  });

  await batch.commit();

  console.log(`Migration complete! Processed ${usersSnapshot.size} users.`);
}

migrateUsersToIntegrations().catch(console.error);