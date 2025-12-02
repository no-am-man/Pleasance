// src/app/api/auth/session/route.ts
import { initializeAdminApp } from '@/firebase/config-admin';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const adminApp = initializeAdminApp();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminApp.auth().createSessionCookie(idToken, { expiresIn });

    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    const status = error.code === 'auth/id-token-revoked' ? 401 : 500;
    const message = error.message || 'Failed to create session.';
    return NextResponse.json({ error: message }, { status });
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
