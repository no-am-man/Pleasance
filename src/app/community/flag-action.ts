
'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
});

// Helper to ensure the admin app is initialized only once.
function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    try {
        // When running in a Google Cloud environment (like App Hosting),
        // it should pick up credentials automatically. Explicitly providing the
        // projectId can help in some cases.
        return admin.initializeApp({
            projectId: process.env.GCLOUD_PROJECT,
        });
    } catch (e) {
        console.error('Firebase Admin Initialization Error in flag-action:', e);
        throw new Error('Server configuration error. Could not initialize Firebase Admin.');
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
