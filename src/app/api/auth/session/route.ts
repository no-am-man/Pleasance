
// src/app/api/auth/session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';

// This is a simplified, temporary way to initialize admin for this route.
// In a larger app, you might share initialization logic.
async function initializeTempAdmin() {
    if (admin.apps.find(app => app?.name === 'session-management')) {
        return admin.app('session-management');
    }
    
    // We need to read the service account key from where we stored it.
    // This creates a temporary default app to read Firestore.
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    const tempFirestore = admin.firestore();
    const credentialsDoc = await tempFirestore.collection('_private_admin_data').doc('credentials').get();

    if (!credentialsDoc.exists) {
        // This can happen if the app is starting for the very first time.
        // We can't create sessions until the key is saved.
        console.warn("Service account key not found in Firestore. Session creation will fail until it's set via the Admin Panel.");
        return null; // Return null to indicate failure
    }
    const serviceAccountKeyBase64 = credentialsDoc.data()?.serviceAccountKeyBase64;
    if (!serviceAccountKeyBase64) {
        console.warn("Service account key is empty in Firestore. Session creation will fail.");
        return null;
    }

    let serviceAccount;
    try {
        const decodedKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decodedKey);
    } catch (e) {
        console.error("Failed to parse the service account key from Firestore for session management.", e);
        return null;
    }

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    }, 'session-management');
}


export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
  }

  const adminApp = await initializeTempAdmin();
  if (!adminApp) {
      return NextResponse.json({ error: 'Server not configured for authentication. Please save credentials on the Admin page.' }, { status: 500 });
  }

  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await admin.auth(adminApp).createSessionCookie(idToken, { expiresIn });

    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    cookies().delete('__session');
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error deleting session cookie:', error);
    return NextResponse.json({ error: 'Failed to sign out.' }, { status: 500 });
  }
}
