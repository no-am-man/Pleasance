
'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import * as admin from 'firebase-admin';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
});

function initializeAdminApp(serviceAccountKey: string) {
    const appName = 'pleasance-flag-generator'; // Use a unique name for this app instance
    // Check if the app is already initialized
    const existingApp = admin.apps.find(app => app?.name === appName);
    if (existingApp) {
        return existingApp;
    }

    let serviceAccount: admin.ServiceAccount;
    try {
        const decodedServiceAccount = Buffer.from(serviceAccountKey, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decodedServiceAccount);
    } catch (e: any) {
        if (e instanceof SyntaxError) {
             throw new Error(`Server configuration error: Failed to parse the service account JSON. Please ensure it is a valid JSON object. Details: ${e.message}`);
        } else {
            throw new Error(`Server configuration error: Failed to decode the service account key from Base64. Please ensure it is a valid Base64 string. Details: ${e.message}`);
        }
    }

    // Initialize the app with the parsed credentials
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    }, appName);
}


export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
    let tempFirestore: admin.firestore.Firestore;

    try {
        // Since we need to read from Firestore to get the key, and we can't use the client SDK
        // in a server action that also uses the admin SDK easily, we do a temporary minimal init
        // of the admin SDK *if it has not been initialized at all*.
        if (admin.apps.length === 0) {
            admin.initializeApp();
        }
        tempFirestore = admin.firestore();

        const credentialsDoc = await tempFirestore.collection('_private_admin_data').doc('credentials').get();
        if (!credentialsDoc.exists) {
            throw new Error("Service account key not found. Please set it in the Admin Panel.");
        }
        const serviceAccountKey = credentialsDoc.data()?.serviceAccountKeyBase64;
        if (!serviceAccountKey) {
            throw new Error("Service account key is empty. Please set it in the Admin Panel.");
        }
        
        const adminApp = initializeAdminApp(serviceAccountKey);
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
