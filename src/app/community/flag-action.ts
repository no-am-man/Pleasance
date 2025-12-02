
'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import * as admin from 'firebase-admin';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
});

/**
 * Gets a Firebase Admin app instance.
 * This function bootstraps the admin app by first reading credentials from Firestore.
 */
async function getAdminAppWithKey() {
    const appName = 'pleasance-flag-generator';
    const existingApp = admin.apps.find(app => app?.name === appName);
    if (existingApp) {
        return existingApp;
    }

    // Initialize a temporary default app instance if none exist, to allow reading from Firestore.
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    
    const tempFirestore = admin.firestore();
    const credentialsDoc = await tempFirestore.collection('_private_admin_data').doc('credentials').get();
    if (!credentialsDoc.exists) {
        throw new Error("Server not configured: Service account key not found. Please set it in the Admin Panel.");
    }
    const serviceAccountKeyBase64 = credentialsDoc.data()?.serviceAccountKeyBase64;
    if (!serviceAccountKeyBase64) {
        throw new Error("Server not configured: Service account key is empty. Please set it in the Admin Panel.");
    }
    
    let serviceAccount: admin.ServiceAccount;
    try {
        const decodedKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decodedKey);
    } catch (e) {
        if (e instanceof SyntaxError) {
             throw new Error(`Server configuration error: Failed to parse the service account JSON. Details: ${e.message}`);
        } else {
            throw new Error(`Server configuration error: Failed to decode the service account key from Base64. Details: ${e.message}`);
        }
    }

    // Initialize the named app with the fetched credentials.
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    }, appName);
}


export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
    try {
        const adminApp = await getAdminAppWithKey();
        const firestore = adminApp.firestore();

        const validatedFields = flagSchema.safeParse(values);
        if (!validatedFields.success) {
            const errorMessage = validatedFields.error.issues[0]?.message || 'Invalid input for flag generation.';
            return { error: errorMessage };
        }
        
        const { communityId, communityName, communityDescription } = validatedFields.data;

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
