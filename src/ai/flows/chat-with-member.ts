
'use server';
/**
 * @fileOverview A flow to handle chat interactions with an AI community member.
 *
 * - chatWithMember - A function that generates a response from an AI member.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GenerateRequest, type ChatHistory } from 'genkit/generate';

const MemberSchema = z.object({
  name: z.string().describe("The AI member's unique name."),
  role: z.string().describe("The member's role in the community."),
  bio: z.string().describe("A short bio describing the member's personality and purpose."),
  type: z.enum(['AI', 'human']).describe('The type of member.'),
});

type ChatWithMemberInput = {
    member: z.infer<typeof MemberSchema>;
    userMessage: string;
    history?: ChatHistory;
};

const ChatWithMemberOutputSchema = z.object({
  response: z.string().describe('The AI member\'s response to the user.'),
});


export async function chatWithMember(input: ChatWithMemberInput) {
  return chatWithMemberFlow(input);
}

const chatWithMemberFlow = ai.defineFlow(
  {
    name: 'chatWithMemberFlow',
    inputSchema: z.any(),
    outputSchema: ChatWithMemberOutputSchema,
  },
  async (input: ChatWithMemberInput) => {

    const systemPrompt = `You are an AI community member. Your persona is defined below. You must stay in character at all times.
Name: ${input.member.name}
Role: ${input.member.role}
Bio: ${input.member.bio}

Your response must be concise, engaging, and directly related to the user's message.`;

    const generateOptions: GenerateRequest = {
        model: 'googleai/gemini-1.5-flash',
        system: systemPrompt,
        prompt: input.userMessage,
    };

    if (input.history) {
        generateOptions.history = input.history;
    }

    const { output } = await ai.generate(generateOptions);
    
    const responseText = output?.text || '';

    return { response: responseText };
  }
);
