// src/firebase/config-admin.ts
import * as admin from 'firebase-admin';

// This function initializes the admin app if it hasn't been already.
// This idempotent approach is safe to call multiple times.
export function initializeAdminApp() {
  // If the app is already initialized, return the existing app.
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  
  if (!serviceAccountKeyBase64 || serviceAccountKeyBase64.trim() === '') {
    throw new Error('Server configuration error: The FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set. This is required for server-side Firebase operations. Please add it to your .env file.');
  }

  try {
    const decodedKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decodedKey);

    // Initialize the app with the parsed credentials.
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      }),
    });
  } catch (e: any) {
    // If parsing or initialization fails, throw a specific error.
    throw new Error(`Server configuration error: Failed to parse or initialize the service account key. Please ensure it is a valid, non-malformed Base64 string. Original error: ${e.message}`);
  }
}
