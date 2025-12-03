'use server';
/**
 * @fileOverview A Genkit tool for getting information about communities.
 *
 * - getCommunityDetailsTool - Tool to fetch details for a specific community.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore } from 'firebase-admin/firestore';
import type { Community } from '@/lib/types';


const GetCommunityDetailsInputSchema = z.object({
  communityName: z.string().describe('The name of the community to look up.'),
});

const MemberSchema = z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    type: z.enum(['AI', 'human']),
});

const GetCommunityDetailsOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  ownerId: z.string(),
  memberCount: z.number(),
  members: z.array(MemberSchema),
});


export const getCommunityDetailsTool = ai.defineTool(
  {
    name: 'getCommunityDetails',
    description: 'Retrieves detailed information about a specific community, including its members.',
    inputSchema: GetCommunityDetailsInputSchema,
    outputSchema: GetCommunityDetailsOutputSchema,
  },
  async (input) => {
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);
    
    const communitiesRef = firestore.collection('communities');
    const snapshot = await communitiesRef.where('name', '==', input.communityName).limit(1).get();

    if (snapshot.empty) {
      throw new Error(`Community with name "${input.communityName}" not found.`);
    }

    const communityDoc = snapshot.docs[0];
    const communityData = communityDoc.data() as Community;

    return {
      id: communityData.id,
      name: communityData.name,
      description: communityData.description,
      ownerId: communityData.ownerId,
      memberCount: communityData.members.length,
      members: communityData.members,
    };
  }
);
