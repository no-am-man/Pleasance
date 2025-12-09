
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

  // The private key from environment variables often has escaped newlines (\\n).
  // We need to replace them with actual newline characters (\n).
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!privateKey) {
      throw new Error('Server configuration error: The FIREBASE_PRIVATE_KEY environment variable is not set or is empty.');
  }

  const serviceAccount = {
      "type": "service_account",
      "project_id": "studio-2441219031-242ae",
      "private_key_id": "97e68f3a34a87754d924151b5c464a93f73315a0",
      "private_key": privateKey,
      "client_email": "firebase-adminsdk-32r47@studio-2441219031-242ae.iam.gserviceaccount.com",
      "client_id": "111956976214470393223",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-32r47%40studio-2441219031-242ae.iam.gserviceaccount.com"
  };
  
  const projectId = "studio-2441219031-242ae";

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: projectId, 
    }, appName);
    return adminApp;

  } catch (e: any) {
    throw new Error(`Server configuration error: Failed to parse or initialize the service account key. Original error: ${e.message}`);
  }
}

// Export the function to get the singleton instance.
export { getAdminApp as initializeAdminApp };
// --- END SINGLETON PATTERN ---
