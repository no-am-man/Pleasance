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
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const { sourceCommunityId, sourceFormId, targetCommunityId, userId, userName, userAvatarUrl } = input;

        const sourceFormRef = firestore.collection(`communities/${sourceCommunityId}/forms`).doc(sourceFormId);
        const targetFormsColRef = firestore.collection(`communities/${targetCommunityId}/forms`);
        const newFormRef = targetFormsColRef.doc(); // Create a new doc with a unique ID

        return firestore.runTransaction(async (transaction) => {
            const sourceFormDoc = await transaction.get(sourceFormRef);
            if (!sourceFormDoc.exists) {
                throw new Error('Original thought-form not found.');
            }
            const sourceFormData = sourceFormDoc.data() as Form;

            // Create the new "echo" form
            const newForm: Omit<Form, 'id'> = {
                ...sourceFormData,
                communityId: targetCommunityId, // Set the new community ID
                originFormId: sourceFormData.originFormId || sourceFormId, // Link back to the original
                originCommunityId: sourceFormData.originCommunityId,
                userId: userId, // The user who echoed it
                userName: userName,
                userAvatarUrl: userAvatarUrl,
                createdAt: FieldValue.serverTimestamp(),
                lastEchoAt: FieldValue.serverTimestamp(), // Mark the echo time
                echoCount: 0, // Echoes of an echo don't count initially
            };

            transaction.set(newFormRef, newForm);

            // Update the original form's echo count and timestamp
            transaction.update(sourceFormRef, {
                echoCount: FieldValue.increment(1),
                lastEchoAt: FieldValue.serverTimestamp(),
            });

            return { newFormId: newFormRef.id };
        });
    }
);
    