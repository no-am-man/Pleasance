// src/app/asset-actions.ts
'use server';

import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

export async function declareAssetWithFileAction(formData: FormData) {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);

        const userId = formData.get('userId') as string;
        const assetName = formData.get('name') as string;
        const description = formData.get('description') as string;
        const type = formData.get('type') as 'physical' | 'virtual' | 'ip';
        const value = Number(formData.get('value'));
        const communityId = formData.get('communityId') as string | undefined;

        if (!userId || !assetName || !description || !type || isNaN(value)) {
            throw new Error("Missing required form fields.");
        }

        const isCommunityAsset = communityId && communityId !== 'private';
        const collectionPath = isCommunityAsset ? `communities/${communityId}/assets` : `users/${userId}/assets`;
        
        const assetColRef = firestore.collection(collectionPath);
        const newAssetRef = assetColRef.doc();
        
        const assetData = {
            id: newAssetRef.id,
            ownerId: userId,
            name: assetName,
            description,
            type,
            value,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            communityId: isCommunityAsset ? communityId : null,
        };

        await newAssetRef.set(assetData);

        return { success: true, message: 'Asset declared successfully.' };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to declare asset: ${message}` };
    }
}
