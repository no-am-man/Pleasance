
'use server';
/**
 * @fileOverview A server action to update the order of cards in a roadmap column.
 *
 * - updateRoadmapCardOrder - The exported server action.
 */

import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { RoadmapCardSchema } from '@/lib/types';

const UpdateOrderInputSchema = z.object({
  columnId: z.string(),
  cards: z.array(RoadmapCardSchema),
});

export async function updateRoadmapCardOrder(columnId: string, cards: z.infer<typeof RoadmapCardSchema>[]) {
    try {
        const validatedInput = UpdateOrderInputSchema.safeParse({ columnId, cards });
        if (!validatedInput.success) {
            throw new Error(`Invalid input: ${validatedInput.error.message}`);
        }

        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);

        const columnRef = firestore.collection('roadmap').doc(columnId);
        
        await columnRef.update({ cards: validatedInput.data.cards });

        return { success: true };

    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: message };
    }
}
