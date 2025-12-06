
// src/ai/flows/save-svg-asset.ts
'use server';
/**
 * @fileOverview A server action to save a generated SVG3D creation as an asset in the user's Treasury.
 *
 * - saveSvgAsset - The exported server action.
 */

import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, serverTimestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { ColorPixelSchema } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';


// 1. Define the input schema for the server action
const SaveAssetInputSchema = z.object({
    userId: z.string(),
    assetName: z.string(),
    value: z.coerce.number(),
    pixels: z.array(ColorPixelSchema),
});
type SaveAssetInput = z.infer<typeof SaveAssetInputSchema>;

// 2. The main server action
export async function saveSvgAsset(input: SaveAssetInput): Promise<{ error?: string; assetId?: string; }> {
    try {
        const validatedInput = SaveAssetInputSchema.safeParse(input);
        if (!validatedInput.success) {
            throw new Error(`Invalid input: ${validatedInput.error.message}`);
        }
        
        const { userId, assetName, value, pixels } = validatedInput.data;
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const storage = getStorage(adminApp);

        // Step 1: Create a new document reference for the asset to get a unique ID
        const assetRef = firestore.collection(`users/${userId}/assets`).doc();
        const assetId = assetRef.id;

        // Step 2: Create the JSON content from the pixels array
        const jsonContent = JSON.stringify({
            id: assetId,
            prompt: assetName, // Use assetName as the prompt for consistency
            pixels,
        });
        const jsonBuffer = Buffer.from(jsonContent, 'utf-8');

        // Step 3: Upload the JSON file to Firebase Storage
        const filePath = `users/${userId}/svg3d-assets/${assetId}.json`;
        const bucket = storage.bucket();
        const file = bucket.file(filePath);

        await file.save(jsonBuffer, {
            metadata: {
                contentType: 'application/json',
            },
        });

        // Make the file publicly readable
        await file.makePublic();
        const fileUrl = file.publicUrl();
        
        // Step 4: Create the asset document in Firestore with the file URL
        const newAsset = {
            id: assetId,
            ownerId: userId,
            name: assetName,
            description: `A 3D point-cloud artwork generated from the prompt: "${assetName}".`,
            type: 'virtual' as const,
            value: value,
            createdAt: serverTimestamp(),
            fileUrl: fileUrl,
        };

        await assetRef.set(newAsset);
        
        return { assetId };

    } catch (e) {
        console.error("Error in saveSvgAsset action:", e);
        const message = e instanceof Error ? e.message : 'An unknown error occurred.';
        return { error: message };
    }
}
