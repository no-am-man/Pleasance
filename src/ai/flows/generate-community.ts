
'use server';
/**
 * @fileOverview A flow to generate a community based on a user prompt, including AI members.
 *
 * - generateCommunity - A function that generates community details and members.
 * - GenerateCommunityInput - The input type for the generateCommunity function.
 * - GenerateCommunityOutput - The return type for the generateCommunity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCommunityInputSchema = z.object({
  prompt: z
    .string()
    .describe('A user-provided prompt describing the desired community.'),
});
export type GenerateCommunityInput = z.infer<typeof GenerateCommunityInputSchema>;

const MemberSchema = z.object({
    name: z.string().describe("The AI member's unique name."),
    role: z.string().describe("The member's role in the community (e.g., 'Guide', 'Archivist', 'Explorer')."),
    bio: z.string().describe("A short, one-sentence bio describing the member's personality and purpose."),
    type: z.enum(['AI']).describe('The type of member, which is always AI for generated members.'),
  });
  
const GenerateCommunityOutputSchema = z.object({
  name: z.string().describe("A concise and catchy name for the community (e.g., 'Cosmic Coders')."),
  description: z.string().describe("A one-sentence description of the community's purpose."),
  welcomeMessage: z.string().describe("A warm, one-paragraph welcome message for new members."),
  members: z.array(MemberSchema).min(3).max(5).describe('A list of 3-5 unique, AI-generated members for the community.'),
});
export type GenerateCommunityOutput = z.infer<typeof GenerateCommunityOutputSchema>;


export async function generateCommunity(input: GenerateCommunityInput): Promise<GenerateCommunityOutput> {
  return generateCommunityFlow(input);
}

const generateCommunityPrompt = ai.definePrompt({
  name: 'generateCommunityPrompt',
  input: {schema: GenerateCommunityInputSchema},
  output: {schema: GenerateCommunityOutputSchema},
  prompt: `You are an expert at founding online communities. Based on the user's prompt, generate a name, a short description, a welcome message, and a diverse cast of 3-5 AI members to populate the community. Each member must have a unique name, role, a one-sentence bio that reflects the community's theme, and the 'type' field must be set to 'AI'.

User Prompt: {{{prompt}}}

Generate a response that is creative, inviting, and directly related to the user's prompt. Make the AI members interesting and give them personalities that would make a new user want to interact with them.`,
});

const generateCommunityFlow = ai.defineFlow(
  {
    name: 'generateCommunityFlow',
    inputSchema: GenerateCommunityInputSchema,
    outputSchema: GenerateCommunityOutputSchema,
  },
  async input => {
    const {output} = await generateCommunityPrompt(input);
    return output!;
  }
);
