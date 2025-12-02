
// src/app/enable-storage-action.ts
'use server';

import { initializeAdminApp } from '@/firebase/config-admin';
import { firebaseConfig } from '@/firebase/config';
import { Storage } from '@google-cloud/storage';
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
        
        // The Storage client will automatically use the credentials from the initialized adminApp.
        const storage = new Storage({
            projectId,
        });

        // Check if the bucket already exists
        const bucket = storage.bucket(bucketName);
        const [exists] = await bucket.exists();

        if (exists) {
            return { data: `Storage bucket '${bucketName}' already exists. No action needed.` };
        }

        // If it doesn't exist, create it.
        await storage.createBucket(bucketName);
        
        // Do not set public access rules, as public access prevention is on.
        // Signed URLs will be used for access.

        return { data: `Successfully created storage bucket '${bucketName}'. File uploads should now work.` };

    } catch (e: any) {
        console.error('Storage enabling error:', e);
        const message = e.message || 'An unexpected error occurred.';
        // Provide more specific feedback for common issues
        if (e.code === 403 || e.code === 7) {
            return { error: `Permission denied. The service account may not have the 'roles/storage.admin' role. Please check IAM settings in Google Cloud Console. Details: ${message}` };
        }
        return { error: `Failed to enable storage: ${message}` };
    }
}
