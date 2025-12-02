
'use server';

import { z } from 'zod';
import { generateFlag } from '@/ai/flows/generate-flag';
import * as admin from 'firebase-admin';

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
    serviceAccountKey: z.string().min(1, { message: "Service account key is required and cannot be empty." }),
});

function initializeAdminApp(serviceAccountKey: string) {
    // Prevent re-initialization
    if (admin.apps.length > 0) {
        return admin.app();
    }

    let serviceAccount: admin.ServiceAccount;

    try {
        const decodedServiceAccount = Buffer.from(serviceAccountKey, 'base64').toString('utf8');
        try {
            serviceAccount = JSON.parse(decodedServiceAccount);
        } catch (e: any) {
            throw new Error(`Server configuration error: Failed to parse the service account JSON. Please ensure it is a valid JSON object. Details: ${e.message}`);
        }
    } catch (e: any) {
        throw new Error(`Server configuration error: Failed to decode the service account key from Base64. Please ensure it is a valid Base64 string. Details: ${e.message}`);
    }

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}


export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
    try {
        const validatedFields = flagSchema.safeParse(values);
        if (!validatedFields.success) {
            const errorMessage = validatedFields.error.issues[0]?.message || 'Invalid input for flag generation.';
            return { error: errorMessage };
        }
        
        const { communityId, communityName, communityDescription, serviceAccountKey } = validatedFields.data;

        const adminApp = initializeAdminApp(serviceAccountKey);

        const flagResult = await generateFlag({ communityName, communityDescription });
        if (!flagResult.svg) {
            throw new Error('Failed to generate a flag SVG from the AI flow.');
        }

        const svgBase64 = Buffer.from(flagResult.svg, 'utf-8').toString('base64');
        const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

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
