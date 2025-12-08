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

  // The service account JSON is now directly included and parsed.
  const serviceAccount = {
      "type": "service_account",
      "project_id": "studio-2441219031-242ae",
      "private_key_id": "97e68f3a34a87754d924151b5c464a93f73315a0",
      "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      "client_email": "firebase-adminsdk-32r47@studio-2441219031-242ae.iam.gserviceaccount.com",
      "client_id": "111956976214470393223",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-32r47%40studio-2441219031-242ae.iam.gserviceaccount.com"
  };

  const projectId = process.env.GCLOUD_PROJECT;
  if (!projectId) {
      throw new Error('Server configuration error: The GCLOUD_PROJECT environment variable is not set.');
  }
  
  if (!serviceAccount.private_key) {
      throw new Error('Server configuration error: The FIREBASE_PRIVATE_KEY environment variable is not set.');
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId, 
    }, appName);

  } catch (e: any) {
    throw new Error(`Server configuration error: Failed to parse or initialize the service account key. Original error: ${e.message}`);
  }
}
