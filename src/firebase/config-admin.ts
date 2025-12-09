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

  // --- Use Individual Environment Variables (More Robust) ---
  const projectId = process.env.GCLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // The private key needs to have its newline characters restored.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Server configuration error: The required Firebase Admin environment variables (GCLOUD_PROJECT, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not set. Please add them to your .env file.');
  }

  try {
    const serviceAccount: admin.ServiceAccount = {
        projectId,
        clientEmail,
        privateKey,
    };
    
    // Initialize the app with the constructed service account object.
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId, 
    }, appName);
    return adminApp;

  } catch (e: any) {
    if (e.code === 'auth/invalid-credential' || e.errorInfo?.code === 'auth/invalid-credential') {
        throw new Error(`Server configuration error: The provided Firebase service account credentials are invalid. This could be due to a revoked key. Please generate a new key from your Firebase project settings and update your .env file. Original error: ${e.message}`);
    }
    throw new Error(`Server configuration error: Failed to initialize Firebase Admin SDK. Original error: ${e.message}`);
  }
}

// Export the function to get the singleton instance.
export { getAdminApp as initializeAdminApp };
