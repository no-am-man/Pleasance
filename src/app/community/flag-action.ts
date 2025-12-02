
'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import { initializeAdminApp } from '@/firebase/config-admin';
import { cookies } from 'next/headers';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
});

export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
    try {
        const adminApp = initializeAdminApp();
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
        const decodedIdToken = await adminApp.auth().verifySessionCookie(sessionCookie, true);
        
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
