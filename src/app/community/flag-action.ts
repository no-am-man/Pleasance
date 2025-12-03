
'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore } from 'firebase-admin/firestore';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
    idToken: z.string(), // Added ID token for verification
});

export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);

        const validatedFields = flagSchema.safeParse(values);
        if (!validatedFields.success) {
            const errorMessage = validatedFields.error.issues[0]?.message || 'Invalid input for flag generation.';
            return { error: errorMessage };
        }
        
        const { communityId, communityName, communityDescription, idToken } = validatedFields.data;

        // Verify the ID token to get the user's UID
        const decodedIdToken = await adminApp.auth().verifyIdToken(idToken);
        const uid = decodedIdToken.uid;

        // Check if the user is the owner of the community
        const communityDoc = await firestore.collection('communities').doc(communityId).get();
        if (!communityDoc.exists) {
            return { error: "Community not found." };
        }
        
        if (communityDoc.data()?.ownerId !== uid) {
            return { error: "Unauthorized: You are not the owner of this community." };
        }

        // Correctly call the Genkit flow
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
        // Provide a more user-friendly message for token verification issues
        if (message.includes('ID token has expired') || message.includes('verifyIdToken')) {
            return { error: "Your session has expired. Please log in again to perform this action."}
        }
        return { error: `Flag generation failed: ${message}` };
    }
}
