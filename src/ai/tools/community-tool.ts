'use server';
/**
 * @fileOverview A Genkit tool for getting information about communities.
 *
 * - getCommunityDetailsTool - Tool to fetch details for a specific community.
 * - echoThoughtFormTool - Tool to echo a form from one community to another.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Community, Form, Member } from '@/lib/types';
import { echoThoughtFormAction } from '@/app/actions';


const GetCommunityDetailsInputSchema = z.object({
  communityName: z.string().describe('The name of the community to look up.'),
});

const MemberSchema = z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    type: z.enum(['AI', 'human']),
    userId: z.string().optional(),
    avatarUrl: z.string().optional(),
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

    // Ensure all members are in the correct format
    const hydratedMembers = await Promise.all(communityData.members.map(async (member) => {
        if (typeof member === 'string') {
            const profileDoc = await firestore.collection('community-profiles').doc(member).get();
            if (profileDoc.exists()) {
                const profile = profileDoc.data();
                return {
                    userId: member,
                    name: profile?.name || 'Unknown',
                    bio: profile?.bio || '',
                    role: 'Member',
                    type: 'human' as const,
                    avatarUrl: profile?.avatarUrl || '',
                };
            }
        }
        return member as Member; // Already in the correct object format
    }));


    return {
      id: communityData.id,
      name: communityData.name,
      description: communityData.description,
      ownerId: communityData.ownerId,
      memberCount: hydratedMembers.length,
      members: hydratedMembers,
    };
  }
);


const EchoFormInputSchema = z.object({
    targetCommunityId: z.string().describe("The ID of the community where the echo should be created."),
    sourceCommunityId: z.string().describe("The ID of the community where the original form exists."),
    sourceFormId: z.string().describe("The ID of the original form to echo."),
    userId: z.string().describe("The ID of the user performing the echo action."),
    userName: z.string().describe("The name of the user performing the echo action."),
    userAvatarUrl: z.string().optional().describe("The avatar URL of the user performing the echo action."),
});

export const echoThoughtFormTool = ai.defineTool(
    {
        name: 'echoThoughtForm',
        description: 'Creates an echo of a "thought-form" from a source community into a target community. This is how ideas are shared across the federation.',
        inputSchema: EchoFormInputSchema,
        outputSchema: z.object({ newFormId: z.string() }),
    },
    async (input) => {
        // This tool now acts as a simple wrapper around the robust server action.
        return await echoThoughtFormAction(input);
    }
);
    
