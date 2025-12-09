
// src/firebase/config-admin.ts
import admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

const appName = 'pleasance-admin';

let adminApp: admin.app.App;

// Type guard to check if the service account has the necessary properties
function isServiceAccount(account: any): account is admin.ServiceAccount {
  return (
    account &&
    typeof account.project_id === 'string' &&
    typeof account.private_key === 'string' &&
    typeof account.client_email === 'string'
  );
}

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
  
  if (!isServiceAccount(serviceAccount)) {
      throw new Error('Server configuration error: The service-account.json file is missing or incomplete. Please download it from your Firebase project settings and place it in the root directory.');
  }

  try {
    // Initialize the app with the service account object.
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    }, appName);
    return adminApp;

  } catch (e: any) {
    if (e.code === 'auth/invalid-credential' || e.errorInfo?.code === 'auth/invalid-credential') {
        throw new Error(`Server configuration error: The provided Firebase service account credentials are invalid. Please generate a new key from your Firebase project settings and update your service-account.json file. Original error: ${e.message}`);
    }
    throw new Error(`Server configuration error: Failed to initialize Firebase Admin SDK. Original error: ${e.message}`);
  }
}

// Export the function to get the singleton instance.
export { getAdminApp as initializeAdminApp };
