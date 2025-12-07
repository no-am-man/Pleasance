// src/ai/flows/update-community-roadmap-column.ts
'use server';
/**
 * @fileOverview A server action to move a card between columns in a community roadmap.
 *
 * - updateCommunityRoadmapCardColumn - The exported server action.
 */

import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { RoadmapCard } from '@/lib/types';

const UpdateColumnInputSchema = z.object({
  communityId: z.string(),
  cardId: z.string(),
  sourceColumnId: z.string(),
  targetColumnId: z.string(),
});

export async function updateCommunityRoadmapCardColumn(communityId: string, cardId: string, sourceColumnId: string, targetColumnId: string) {
    try {
        const validatedInput = UpdateColumnInputSchema.safeParse({ communityId, cardId, sourceColumnId, targetColumnId });
        if (!validatedInput.success) {
            throw new Error(`Invalid input: ${validatedInput.error.message}`);
        }

        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        
        const sourceColRef = firestore.doc(`communities/${communityId}/roadmap/${sourceColumnId}`);
        const targetColRef = firestore.doc(`communities/${communityId}/roadmap/${targetColumnId}`);

        await firestore.runTransaction(async (transaction) => {
            const sourceDoc = await transaction.get(sourceColRef);
            const targetDoc = await transaction.get(targetColRef);

            if (!sourceDoc.exists) {
                throw new Error(`Source column "${sourceColumnId}" not found.`);
            }
             if (!targetDoc.exists) {
                throw new Error(`Target column "${targetColumnId}" not found.`);
            }

            const sourceData = sourceDoc.data();
            
            const cardToMove = sourceData?.cards.find((c: RoadmapCard) => c.id === cardId);

            if (!cardToMove) {
                console.warn(`Card with ID ${cardId} not found in source column ${sourceColumnId}. It may have already been moved.`);
                return; // Exit transaction gracefully if card is already moved.
            }

            // Atomically remove from source and add to target
            transaction.update(sourceColRef, { cards: FieldValue.arrayRemove(cardToMove) });
            transaction.update(targetColRef, { cards: FieldValue.arrayUnion(cardToMove) });
        });
        
        return { success: true };

    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        console.error("Error moving roadmap card:", message);
        return { error: message };
    }
}
