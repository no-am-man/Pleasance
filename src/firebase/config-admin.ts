// src/firebase/config-admin.ts
import * as admin from 'firebase-admin';

// This function attempts to parse the service account key and initialize the app.
// It will only run once per server instance.
function initialize() {
  if (admin.apps.length > 0) {
    return;
  }
  
  const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  
  if (!serviceAccountKeyBase64 || serviceAccountKeyBase64.trim() === '') {
    // We throw a more descriptive error if the environment variable is missing.
    throw new Error('Server configuration error: The FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set. This is required for server-side Firebase operations. Please add it to your .env file.');
  }

  try {
    const decodedKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decodedKey);

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      }),
    });
  } catch (e: any) {
    // If parsing or initialization fails, we throw a specific error.
    throw new Error(`Server configuration error: Failed to parse or initialize the service account key. Please ensure it is a valid, non-malformed Base64 string. Original error: ${e.message}`);
  }
}

// Call the initialization function at the module level.
// This ensures it runs only once.
initialize();

/**
 * Returns the initialized Firebase Admin app instance.
 * This is the central, unified way to access the Admin SDK for all server-side operations.
 */
export function initializeAdminApp() {
  // Since initialization is now guaranteed to have happened, we can just return the app.
  return admin.app();
}
