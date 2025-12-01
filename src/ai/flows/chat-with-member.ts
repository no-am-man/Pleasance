
'use server';
/**
 * @fileOverview A flow to handle chat interactions with an AI community member.
 *
 * - chatWithMember - A function that generates a response from an AI member.
 * - ChatWithMemberInput - The input type for the chatWithMember function.
 * - ChatWithMemberOutput - The return type for the chatWithMember function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase/config-for-actions';
import { doc, updateDoc, getDoc, increment } from 'firebase/firestore';


const MemberSchema = z.object({
  name: z.string().describe("The AI member's unique name."),
  role: z.string().describe("The member's role in the community."),
  bio: z.string().describe("A short bio describing the member's personality and purpose."),
  type: z.enum(['AI', 'human']).describe('The type of member.'),
});

const ChatHistorySchema = z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
});

const ChatWithMemberInputSchema = z.object({
  communityId: z.string().describe('The ID of the community the member belongs to.'),
  member: MemberSchema.describe('The AI member the user is chatting with.'),
  userMessage: z.string().describe('The latest message from the user.'),
  history: z.array(ChatHistorySchema).optional().describe('The recent chat history.'),
});
export type ChatWithMemberInput = z.infer<typeof ChatWithMemberInputSchema>;

const ChatWithMemberOutputSchema = z.object({
  response: z.string().describe('The AI member\'s response to the user.'),
});
export type ChatWithMemberOutput = z.infer<typeof ChatWithMemberOutputSchema>;


export async function chatWithMember(input: ChatWithMemberInput): Promise<ChatWithMemberOutput> {
  return chatWithMemberFlow(input);
}

const chatWithMemberFlow = ai.defineFlow(
  {
    name: 'chatWithMemberFlow',
    inputSchema: ChatWithMemberInputSchema,
    outputSchema: ChatWithMemberOutputSchema,
  },
  async (input) => {

    const systemPrompt = `You are an AI community member. Your persona is defined below. You must stay in character at all times.
Name: ${input.member.name}
Role: ${input.member.role}
Bio: ${input.member.bio}

Your response must be concise, engaging, and directly related to the user's message.`;

    const { firestore } = initializeFirebase();

    // Use a try-catch block for the Firestore operation for robustness.
    try {
        const communityRef = doc(firestore, 'communities', input.communityId);
        const communitySnap = await getDoc(communityRef);

        if (communitySnap.exists()) {
            const communityData = communitySnap.data();
            const members = communityData.members || [];
            
            // Find the specific AI member and update their interaction count
            const updatedMembers = members.map((m: any) => {
                if (m.name === input.member.name && m.type === 'AI') {
                    return {
                        ...m,
                        interactionCount: (m.interactionCount || 0) + 1,
                    };
                }
                return m;
            });
            
            // Update the document with the new members array
            await updateDoc(communityRef, { members: updatedMembers });
        }
    } catch (error) {
        // Log the error but don't block the chat response
        console.error("Failed to increment AI member interaction count:", error);
    }


    const { text } = await ai.generate({
        system: systemPrompt,
        prompt: input.userMessage,
        history: input.history,
    });

    return { response: text };
  }
);

    