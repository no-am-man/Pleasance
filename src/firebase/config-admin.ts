// src/firebase/config-admin.ts
import admin from 'firebase-admin';

const appName = 'pleasance-admin';

// This function ensures Firebase Admin is initialized only once.
export function initializeAdminApp() {
  // Check if the app is already initialized to prevent errors
  const existingApp = admin.apps.find(app => app?.name === appName);
  if (existingApp) {
    return existingApp;
  }

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('Server configuration error: The FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
  }

  // This is the critical variable.
  const projectId = process.env.GCLOUD_PROJECT;
  if (!projectId) {
      throw new Error('Server configuration error: The GCLOUD_PROJECT environment variable is not set.');
  }

  try {
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId, // Explicitly setting the projectId to ensure correct targeting.
    }, appName);

  } catch (e: any) {
    throw new Error(`Server configuration error: Failed to parse or initialize the service account key. Original error: ${e.message}`);
  }
}
