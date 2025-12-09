// src/firebase/config-admin.ts
import admin from 'firebase-admin';

const appName = 'pleasance-admin';

// --- SINGLETON PATTERN ---
// A self-invoking function that ensures only one instance of the Firebase Admin app is created.

let adminApp: admin.app.App;

function getAdminApp(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }

  const existingApp = admin.apps.find(app => app?.name === appName);
  if (existingApp) {
    adminApp = existingApp;
    return adminApp;
  }

  const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJSON) {
      throw new Error('Server configuration error: The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set or is empty.');
  }

  let serviceAccount: admin.ServiceAccount;
  try {
      serviceAccount = JSON.parse(serviceAccountJSON);
  } catch (e) {
      throw new Error('Server configuration error: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Please ensure it is a valid JSON string.');
  }

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id, 
    }, appName);
    return adminApp;

  } catch (e: any) {
    if (e.code === 'auth/invalid-credential') {
        throw new Error(`Server configuration error: The provided Firebase service account credential is invalid. This could be due to an incorrect key or a revoked key. Please generate a new key from your Firebase project settings. Original error: ${e.message}`);
    }
    throw new Error(`Server configuration error: Failed to initialize Firebase Admin SDK. Original error: ${e.message}`);
  }
}

// Export the function to get the singleton instance.
export { getAdminApp as initializeAdminApp };
// --- END SINGLETON PATTERN ---
