
'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import { initializeAdminApp } from '@/firebase/config-admin';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
    idToken: z.string(),
});

export async function generateFlagFromPrompt(values: z.infer<typeof flagSchema>) {
    try {
        const adminApp = initializeAdminApp();
        
        const validatedFields = flagSchema.safeParse(values);
        if (!validatedFields.success) {
            const errorMessage = validatedFields.error.issues[0]?.message || 'Invalid input.';
            return { error: errorMessage };
        }
        
        const { communityId, communityName, communityDescription, idToken } = validatedFields.data;

        // Verify the ID token to get the user's UID and ensure they are the owner
        const decodedIdToken = await adminApp.auth().verifyIdToken(idToken);
        const uid = decodedIdToken.uid;

        const communityDoc = await adminApp.firestore().collection('communities').doc(communityId).get();
        if (!communityDoc.exists || communityDoc.data()?.ownerId !== uid) {
            return { error: "Unauthorized: You are not the owner of this community." };
        }

        // Correctly call the Genkit flow
        const flagResult = await generateFlag({ communityName, communityDescription });
        if (!flagResult.svg) {
            throw new Error('Failed to generate a flag SVG from the AI flow.');
        }

        const svgBase64 = Buffer.from(flagResult.svg, 'utf-8').toString('base64');
        const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

        return {
            data: {
                flagUrl: svgDataUri,
            }
        };

    } catch (e) {
        console.error('Flag Generation Action Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        if (message.includes('ID token has expired') || message.includes('verifyIdToken')) {
            return { error: "Your session has expired. Please log in again."}
        }
        return { error: `Flag generation failed: ${message}` };
    }
}
