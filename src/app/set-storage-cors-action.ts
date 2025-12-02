
// src/app/set-storage-cors-action.ts
'use server';

import { initializeAdminApp } from '@/firebase/config-admin';
import { firebaseConfig } from '@/firebase/config';
import { Storage } from '@google-cloud/storage';
import { cookies } from 'next/headers';

export async function setStorageCors() {
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

        const bucketName = firebaseConfig.storageBucket;
        if (!bucketName) {
            return { error: 'Firebase project configuration is missing the storageBucket name.' };
        }
        
        // The Storage client will automatically use the admin app's credentials.
        const storage = new Storage({
            projectId: firebaseConfig.projectId,
        });
        
        const corsConfiguration = [{
            origin: ['*'], // Allow all origins for simplicity in this context.
            method: ['GET'],
            responseHeader: ['Content-Type'],
            maxAgeSeconds: 3600,
        }];

        await storage.bucket(bucketName).setCorsConfiguration(corsConfiguration);

        return { data: `Successfully set CORS policy on bucket '${bucketName}'. Audio playback should now be enabled.` };

    } catch (e: any) {
        console.error('CORS setup error:', e);
        const message = e.message || 'An unexpected error occurred.';
        if (e.code === 403 || e.code === 7) {
            return { error: `Permission denied. The service account may not have the 'Storage Object Admin' or a similar role. Please check IAM settings in Google Cloud Console. Details: ${message}` };
        }
        return { error: `Failed to set CORS policy: ${message}` };
    }
}
