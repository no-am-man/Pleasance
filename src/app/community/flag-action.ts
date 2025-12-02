
'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import * as admin from 'firebase-admin';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
});

export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
    try {
        // Initialize Firebase Admin SDK only if not already initialized
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                storageBucket: 'studio-2441219031-242ae.firebasestorage.app',
            });
        }
        
        const validatedFields = flagSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for flag generation.' };
        }
        
        const { communityId, communityName, communityDescription } = validatedFields.data;

        const flagResult = await generateFlag({ communityName, communityDescription });
        if (!flagResult.flagUrl) {
            throw new Error('Failed to generate a flag image from the AI flow.');
        }

        const bucket = admin.storage().bucket();
        const filePath = `communities/${communityId}/flag.png`;
        const file = bucket.file(filePath);

        const [signedUrl] = await file.getSignedUrl({
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType: 'image/png',
        });
        
        const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

        return {
            data: {
                signedUrl,
                imageDataUri: flagResult.flagUrl,
                downloadURL,
            }
        };

    } catch (e) {
        console.error('Flag Generation Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Flag generation failed: ${message}` };
    }
}
