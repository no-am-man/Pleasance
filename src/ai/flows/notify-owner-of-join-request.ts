
'use server';
/**
 * @fileOverview A flow to notify a community owner about a new join request.
 *
 * - notifyOwnerOfJoinRequest - A function that generates and posts the notification.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, serverTimestamp } from 'firebase-admin/firestore';

const NotifyInputSchema = z.object({
  communityId: z.string().describe("The ID of the community."),
  communityName: z.string().describe("The name of the community."),
  requestingUserName: z.string().describe("The name of the user requesting to join."),
});
type NotifyInput = z.infer<typeof NotifyInputSchema>;

const NotifyOutputSchema = z.object({
  notificationMessage: z.string().describe("The generated notification message for the owner."),
});

const notifyPrompt = ai.definePrompt({
    name: 'notifyOwnerPrompt',
    input: { schema: NotifyInputSchema },
    output: { schema: NotifyOutputSchema },
    config: {
        model: 'googleai/gemini-1.5-flash-001',
    },
    prompt: `You are the Concierge of the "{{communityName}}" online community.

A user named "{{requestingUserName}}" has just requested to join the community.

Your task is to write a brief, private notification message to the community owner to inform them of this. Keep it to one sentence and include the user's name.
`,
});

export async function notifyOwnerOfJoinRequest(input: NotifyInput): Promise<{ success: boolean; error?: string }> {
    try {
        // Step 1: Generate the notification message text
        const { output } = await notifyPrompt(input);
        
        if (!output?.notificationMessage) {
            throw new Error('AI failed to generate a notification message.');
        }

        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        
        // Step 2: Post the message to the community's feed, but mark it for the owner only
        const formsColRef = firestore.collection(`communities/${input.communityId}/forms`);
        const newForm = {
            communityId: input.communityId,
            originCommunityId: input.communityId,
            userId: 'concierge-agent', // A static ID for the agent
            userName: 'Concierge',
            userAvatarUrl: `https://i.pravatar.cc/150?u=concierge`,
            type: 'text' as const,
            text: output.notificationMessage,
            status: 'active' as const,
            createdAt: serverTimestamp(),
            audience: 'owner' as const,
        };

        await formsColRef.add(newForm);

        return { success: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        console.error("NotifyOwner Flow Error:", message);
        return { success: false, error: message };
    }
}
