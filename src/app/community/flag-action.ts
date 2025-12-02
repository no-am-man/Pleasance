
'use server';

import 'dotenv/config';
import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
});

function getAdminApp() {
    const appName = 'pleasance-flag-generator';
    const existingApp = admin.apps.find(app => app?.name === appName);
    if (existingApp) {
        return existingApp;
    }

    const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountKeyBase64) {
        throw new Error("Server not configured: FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set. Please add it to your .env file.");
    }

    let serviceAccount;
    try {
        const decodedKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decodedKey);
    } catch (e) {
        throw new Error("Server not configured: Failed to parse the service account key. It may be malformed.");
    }
    
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    }, appName);
}


export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
    try {
        const adminApp = getAdminApp();
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
        if (!sessionCookie) {
             return { error: "Unauthorized: You must be logged in to perform this action." };
        }
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
