// src/firebase/config-admin.ts
import * as admin from 'firebase-admin';

/**
 * Initializes and returns a Firebase Admin app instance, ensuring it only happens once.
 * This is the central, unified way to access the Admin SDK for all server-side operations.
 *
 * It securely initializes the app using credentials from environment variables.
 * If initialization fails, it throws a clear, descriptive error.
 */
export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  
  if (!serviceAccountKeyBase64 || serviceAccountKeyBase64.trim() === '') {
    throw new Error('Server configuration error: The FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set. This is required for server-side Firebase operations like the Admin Panel and Flag Generation. Please add it to your .env file to use these features.');
  }

  try {
    const decodedKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decodedKey);

    // Explicitly construct the credential object to avoid parsing issues.
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'), // Ensure private key newlines are handled
      }),
    });
  } catch (e: any) {
    throw new Error(`Server configuration error: Failed to parse the service account key. Please ensure it is a valid, non-malformed Base64 string. Original error: ${e.message}`);
  }
}
