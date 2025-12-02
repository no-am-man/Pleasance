// src/app/api/auth/session/route.ts
import 'dotenv/config';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';

async function initializeAdminApp() {
    const appName = 'session-management';
    const existingApp = admin.apps.find(app => app?.name === appName);
    if (existingApp) {
        return existingApp;
    }

    const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountKeyBase64) {
        console.warn("Server not configured: FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set. Session creation will fail until it's set in the .env file.");
        return null;
    }

    let serviceAccount;
    try {
        const decodedKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decodedKey);
    } catch (e) {
        console.error("Failed to parse the service account key from environment variable.", e);
        return null;
    }

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    }, appName);
}


export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
  }

  const adminApp = await initializeAdminApp();
  if (!adminApp) {
      return NextResponse.json({ error: 'Server not configured for authentication. Please set the FIREBASE_SERVICE_ACCOUNT_BASE64 in your .env file.' }, { status: 500 });
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
