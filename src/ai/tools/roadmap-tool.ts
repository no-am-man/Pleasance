
'use server';
/**
 * @fileOverview A Genkit tool for interacting with the project roadmap.
 *
 * - getRoadmapColumnTool - The tool function for getting roadmap data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { RoadmapColumnSchema } from '@/lib/types';


const GetRoadmapColumnInputSchema = z.object({
  columnId: z.enum(['ideas', 'nextUp', 'inProgress', 'alive']).describe('The ID of the roadmap column to retrieve.'),
});


export const getRoadmapColumnTool = ai.defineTool(
  {
    name: 'getRoadmapColumn',
    description: 'Retrieves all cards from a specific column on the project roadmap. Use this to answer questions about what is planned, in progress, or completed.',
    inputSchema: GetRoadmapColumnInputSchema,
    outputSchema: RoadmapColumnSchema,
  },
  async (input) => {
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);
    
    const columnRef = firestore.collection('roadmap').doc(input.columnId);
    const columnSnap = await columnRef.get();

    if (!columnSnap.exists) {
      throw new Error(`Roadmap column "${input.columnId}" not found.`);
    }

    return columnSnap.data() as z.infer<typeof RoadmapColumnSchema>;
  }
);

    