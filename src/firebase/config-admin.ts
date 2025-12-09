// src/firebase/config-admin.ts
import admin from 'firebase-admin';

const appName = 'pleasance-admin';

let adminApp: admin.app.App;

function getAdminApp(): admin.app.App {
  // If the app is already initialized, return it.
  if (adminApp) {
    return adminApp;
  }

  // Check if an app with this name has already been initialized.
  const existingApp = admin.apps.find(app => app?.name === appName);
  if (existingApp) {
    adminApp = existingApp;
    return adminApp;
  }

  // Get the entire service account JSON from the environment variable.
  const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJSON) {
      throw new Error('Server configuration error: The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set or is empty.');
  }

  let serviceAccount: admin.ServiceAccount;
  try {
      // Parse the JSON string into an object.
      serviceAccount = JSON.parse(serviceAccountJSON);
  } catch (e) {
      throw new Error('Server configuration error: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Please ensure it is a valid JSON string.');
  }
  
  try {
    // Initialize the app with the full service account object.
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
