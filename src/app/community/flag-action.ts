
'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import * as admin from 'firebase-admin';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
});

// Helper to ensure the admin app is initialized only once.
function initializeAdminApp() {
    // Check if the default app is already initialized to prevent errors.
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!serviceAccountBase64) {
        throw new Error('Server configuration error: The FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set. Please ensure it is set in your deployment environment or .env file.');
    }

    let serviceAccountJson;
    try {
        serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    } catch (e) {
        console.error('Firebase Admin Initialization Error: Failed to decode Base64 service account key.', e);
        throw new Error('Server configuration error: The provided service account key is not a valid Base64 string.');
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
        console.error('Firebase Admin Initialization Error: Failed to parse service account JSON.', e);
        throw new Error('Server configuration error: The decoded service account key is not valid JSON. Please check for formatting errors. You can verify the decoded output by pasting your key at https://www.base64decode.org/ and checking if the result is valid JSON.');
    }

    try {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
    } catch (e) {
        console.error('Firebase Admin Initialization Error in flag-action:', e);
        throw new Error('Server configuration error: Could not initialize Firebase Admin. The service account key may be invalid or malformed.');
    }
}

export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
    try {
        const adminApp = initializeAdminApp();

        const validatedFields = flagSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for flag generation.' };
        }
        
        const { communityId, communityName, communityDescription } = validatedFields.data;

        // 1. Generate the SVG string using the AI flow
        const flagResult = await generateFlag({ communityName, communityDescription });
        if (!flagResult.svg) {
            throw new Error('Failed to generate a flag SVG from the AI flow.');
        }

        // 2. Convert the SVG string to a Base64 data URI
        const svgBase64 = Buffer.from(flagResult.svg, 'utf-8').toString('base64');
        const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

        // 3. Update the community document in Firestore using the Admin SDK
        const firestore = adminApp.firestore();
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
