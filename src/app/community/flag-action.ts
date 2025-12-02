'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import { initializeFirebase } from '@/firebase/config-for-actions';
import { doc, updateDoc } from 'firebase/firestore';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
});

function toBase64(str: string): string {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str).toString('base64');
    } else {
      // Browser environment
      return btoa(unescape(encodeURIComponent(str)));
    }
}

export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
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

        // 3. Update the community document in Firestore
        const { firestore } = initializeFirebase();
        const communityDocRef = doc(firestore, 'communities', communityId);
        await updateDoc(communityDocRef, { flagUrl: svgDataUri });

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
