
'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
});

/**
 * Gets a Firebase Admin app instance that has been verified to be used by the founder.
 * This is a critical function for actions that require elevated privileges.
 */
async function getFounderVerifiedAdminApp() {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
        throw new Error('Unauthorized: No session cookie found. Please log in again.');
    }
    
    // Initialize a temporary default app instance if none exist, to allow reading from Firestore.
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    
    // First, verify the user is the founder using the default app.
    const defaultAuth = admin.auth();
    const decodedIdToken = await defaultAuth.verifySessionCookie(sessionCookie, true);
    if (decodedIdToken.email !== 'gg.el0ai.com@gmail.com') {
        throw new Error('Unauthorized: You are not the founder.');
    }

    // Now that the user is verified, fetch the service account key.
    const tempFirestore = admin.firestore();
    const credentialsDoc = await tempFirestore.collection('_private_admin_data').doc('credentials').get();

    if (!credentialsDoc.exists) {
        throw new Error("Server not configured: Service account key not found in Firestore. Please set it on the Admin Panel.");
    }

    const serviceAccountKeyBase64 = credentialsDoc.data()?.serviceAccountKeyBase64;
    if (!serviceAccountKeyBase64) {
        throw new Error("Server not configured: Service account key is empty in Firestore. Please check the Admin Panel.");
    }

    let serviceAccount;
    try {
        const decodedKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decodedKey);
    } catch (e) {
        throw new Error("Server not configured: Failed to parse the service account key from Firestore. It may be malformed.");
    }
    
    // Use a named app to avoid re-initialization errors.
    const appName = 'pleasance-flag-generator';
    const existingApp = admin.apps.find(app => app?.name === appName);
    
    if (existingApp) {
        return existingApp;
    }

    // Initialize the named app with the fetched credentials.
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    }, appName);
}


export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
    try {
        const adminApp = await getFounderVerifiedAdminApp();
        const firestore = adminApp.firestore();

        const validatedFields = flagSchema.safeParse(values);
        if (!validatedFields.success) {
            const errorMessage = validatedFields.error.issues[0]?.message || 'Invalid input for flag generation.';
            return { error: errorMessage };
        }
        
        const { communityId, communityName, communityDescription } = validatedFields.data;

        // Check if the user is the owner of the community
        const communityDoc = await firestore.collection('communities').doc(communityId).get();
        if (!communityDoc.exists) {
            return { error: "Community not found." };
        }

        const sessionCookie = cookies().get('__session')?.value || '';
        const decodedIdToken = await admin.auth(adminApp).verifySessionCookie(sessionCookie, true);
        
        if (communityDoc.data()?.ownerId !== decodedIdToken.uid) {
            return { error: "Unauthorized: You are not the owner of this community." };
        }

        const flagResult = await generateFlag({ communityName, communityDescription });
        if (!flagResult.svg) {
            throw new Error('Failed to generate a flag SVG from the AI flow.');
        }

        const svgBase64 = Buffer.from(flagResult.svg, 'utf-8').toString('base64');
        const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

        const communityDocRef = firestore.collection('communities').doc(communityId);
        await communityDocRef.update({ flagUrl: svgDataUri });

        return {
            data: {
                flagUrl: svgDataUri,
            }
        };

    } catch (e) {
        console.error('Flag Generation Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Flag generation failed: ${message}` };
    }
}
