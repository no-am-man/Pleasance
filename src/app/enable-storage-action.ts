// src/app/enable-storage-action.ts
'use server';

import { initializeAdminApp } from '@/firebase/config-admin';
import { firebaseConfig } from '@/firebase/config';
import { google } from 'googleapis';
import { cookies } from 'next/headers';

export async function enableStorage() {
    try {
        const adminApp = initializeAdminApp();
        const sessionCookie = cookies().get('__session')?.value || '';
        if (!sessionCookie) {
            return { error: "Unauthorized: You must be logged in." };
        }
        
        const decodedIdToken = await adminApp.auth().verifySessionCookie(sessionCookie, true);
        if (decodedIdToken.email !== 'gg.el0ai.com@gmail.com') {
            return { error: "Unauthorized: Only the founder can perform this action." };
        }

        const projectId = firebaseConfig.projectId;
        const bucketName = firebaseConfig.storageBucket;
        
        // This creates a credential from the service account used by firebase-admin
        const auth = new google.auth.GoogleAuth({
            credentials: (adminApp.options.credential as any).credential.serviceAccount,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        const storage = google.storage({ version: 'v1', auth });

        // Check if the bucket already exists
        try {
            const [existingBucket] = await storage.buckets.get({ bucket: bucketName });
            if (existingBucket) {
                return { data: `Storage bucket '${bucketName}' already exists. No action needed.` };
            }
        } catch (e: any) {
            if (e.code !== 404) {
                 throw new Error(`Failed to check for bucket: ${e.message}`);
            }
            // If it's a 404, we proceed to create it.
        }

        // If it doesn't exist, create it.
        await storage.buckets.insert({
            project: projectId,
            name: bucketName,
        });
        
        // Do not set public access rules, as public access prevention is on.
        // Signed URLs will be used for access.

        return { data: `Successfully created storage bucket '${bucketName}'. File uploads should now work.` };

    } catch (e: any) {
        console.error('Storage enabling error:', e);
        const message = e.message || 'An unexpected error occurred.';
        // Provide more specific feedback for common issues
        if (e.code === 403) {
            return { error: `Permission denied. The service account may not have the 'roles/storage.admin' role. Please check IAM settings in Google Cloud Console. Details: ${message}` };
        }
        return { error: `Failed to enable storage: ${message}` };
    }
}
