
'use server';
/**
 * @fileOverview A flow to generate a welcome message from the Concierge to a new member.
 *
 * - welcomeNewMember - A function that generates and posts the welcome message.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, serverTimestamp } from 'firebase-admin/firestore';

const WelcomeInputSchema = z.object({
  communityId: z.string().describe("The ID of the community the member joined."),
  communityName: z.string().describe("The name of the community."),
  newMemberName: z.string().describe("The name of the new member."),
});
type WelcomeInput = z.infer<typeof WelcomeInputSchema>;

const WelcomeOutputSchema = z.object({
  welcomeMessage: z.string().describe("The generated welcome message text from the Concierge."),
});

const welcomePrompt = ai.definePrompt({
    name: 'welcomeNewMemberPrompt',
    input: { schema: WelcomeInputSchema },
    output: { schema: WelcomeOutputSchema },
    config: {
        model: 'googleai/gemini-1.5-pro-preview-0514',
    },
    prompt: `You are the Concierge of the "{{communityName}}" online community.

A new member named "{{newMemberName}}" has just joined.

Your task is to write a brief, warm, and welcoming message to them. Post this message in the main community feed. Mention the new member by name. Keep it to one or two sentences.
`,
});

export async function welcomeNewMember(input: WelcomeInput): Promise<{ success: boolean; error?: string }> {
    try {
        // Step 1: Generate the welcome message text
        const { output } = await welcomePrompt(input);
        
        if (!output?.welcomeMessage) {
            throw new Error('AI failed to generate a welcome message.');
        }

        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        
        // Step 2: Post the message to the community's feed
        const formsColRef = firestore.collection(`communities/${input.communityId}/forms`);
        const newForm = {
            communityId: input.communityId,
            originCommunityId: input.communityId,
            userId: 'concierge-agent', // A static ID for the agent
            userName: 'Concierge',
            userAvatarUrl: `https://i.pravatar.cc/150?u=concierge`,
            type: 'text' as const,
            text: output.welcomeMessage,
            status: 'active' as const,
            createdAt: serverTimestamp(),
        };

        await formsColRef.add(newForm);

        return { success: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        console.error("WelcomeNewMember Flow Error:", message);
        return { success: false, error: message };
    }
}
