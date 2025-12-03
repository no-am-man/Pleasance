
'use server';
/**
 * @fileOverview A flow to update assignees on a roadmap card.
 *
 * - updateCardAssignees - A function that adds or removes an assignee from a card.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { RoadmapColumn, RoadmapCard } from '@/lib/types';


const UpdateAssigneesInputSchema = z.object({
  columnId: z.string().describe('The ID of the column containing the card.'),
  cardId: z.string().describe('The ID of the card to update.'),
  assigneeName: z.string().describe('The name of the user to assign or unassign.'),
  shouldAssign: z.boolean().describe('Whether to assign (true) or unassign (false) the user.'),
});
type UpdateAssigneesInput = z.infer<typeof UpdateAssigneesInputSchema>;

const UpdateAssigneesOutputSchema = z.object({
    newAssignees: z.array(z.string()).describe('The updated list of assignee names on the card.'),
    error: z.string().optional().describe('An error message if the operation failed.'),
});


export async function updateCardAssignees(input: UpdateAssigneesInput): Promise<z.infer<typeof UpdateAssigneesOutputSchema>> {
  return updateCardAssigneesFlow(input);
}


const updateCardAssigneesFlow = ai.defineFlow(
  {
    name: 'updateCardAssigneesFlow',
    inputSchema: UpdateAssigneesInputSchema,
    outputSchema: UpdateAssigneesOutputSchema,
  },
  async (input) => {
    try {
        const { columnId, cardId, assigneeName, shouldAssign } = input;
        
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);

        const columnRef = firestore.collection('roadmap').doc(columnId);
        const columnSnap = await columnRef.get();

        if (!columnSnap.exists) {
            throw new Error(`Column "${columnId}" not found.`);
        }

        const columnData = columnSnap.data() as RoadmapColumn;
        const cardIndex = columnData.cards.findIndex(c => c.id === cardId);

        if (cardIndex === -1) {
            throw new Error(`Card "${cardId}" not found in column "${columnId}".`);
        }
        
        const cardToUpdate = columnData.cards[cardIndex];
        const updatedCards = [...columnData.cards];
        let newAssignees: string[];

        if (shouldAssign) {
            // Add assignee if they don't already exist
            newAssignees = [...new Set([...(cardToUpdate.assignees || []), assigneeName])];
        } else {
            // Remove assignee
            newAssignees = (cardToUpdate.assignees || []).filter(name => name !== assigneeName);
        }
        
        updatedCards[cardIndex] = { ...cardToUpdate, assignees: newAssignees };
        
        await columnRef.update({ cards: updatedCards });

        return { newAssignees };

    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
      return { newAssignees: [], error: `Flow failed: ${message}` };
    }
  }
);
