
// src/firebase/config-admin.ts
import admin from 'firebase-admin';
import { firebaseConfig } from './config';

const appName = 'pleasance-admin';

// This function ensures Firebase Admin is initialized only once.
export function initializeAdminApp() {
  // Check if the app is already initialized to prevent errors
  const existingApp = admin.apps.find(app => app?.name === appName);
  if (existingApp) {
    return existingApp;
  }

  // Retrieve the base64 encoded service account key from environment variables
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('Server configuration error: The FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
  }

  try {
    // Decode the base64 string into a JSON string
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    // The private_key in the JSON often has literal '\n' which need to be replaced with actual newlines.
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    // Initialize the Firebase Admin SDK
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: firebaseConfig.storageBucket,
    }, appName);

  } catch (e: any) {
    // If parsing or initialization fails, we throw a specific error.
    throw new Error(`Server configuration error: Failed to parse or initialize the service account key. Please ensure it is a valid, non-malformed Base64 string. Original error: ${e.message}`);
  }
}

    