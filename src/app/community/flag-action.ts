
'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import * as admin from 'firebase-admin';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
});

function toBase64(str: string): string {
    // This function can run in Node.js or browser environments.
    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      return Buffer.from(str, 'utf-8').toString('base64');
    } else {
      // Browser environment (fallback, though this action is server-only)
      return btoa(unescape(encodeURIComponent(str)));
    }
}

const APP_NAME = 'pleasance-admin';

export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
    // Robust Initialization: Initialize inside the action to guarantee it runs before use.
    if (!admin.apps.some(app => app?.name === APP_NAME)) {
        try {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            }, APP_NAME);
        } catch (e) {
            console.error('Firebase Admin Initialization Error in flag-action:', e);
            return { error: 'Server configuration error. Could not initialize Firebase Admin.' };
        }
    }

    try {
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
        const svgBase64 = toBase64(flagResult.svg);
        const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

        // 3. Update the community document in Firestore using the Admin SDK
        const firestore = admin.app(APP_NAME).firestore();
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

