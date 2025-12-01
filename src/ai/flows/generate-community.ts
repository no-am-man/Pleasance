'use server';
/**
 * @fileOverview A flow to generate a community based on a user prompt.
 *
 * - generateCommunity - A function that generates community details.
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

const GenerateCommunityOutputSchema = z.object({
  name: z.string().describe("A concise and catchy name for the community (e.g., 'Cosmic Coders')."),
  description: z.string().describe("A one-sentence description of the community's purpose."),
  welcomeMessage: z.string().describe("A warm, one-paragraph welcome message for new members."),
});
export type GenerateCommunityOutput = z.infer<typeof GenerateCommunityOutputSchema>;


export async function generateCommunity(input: GenerateCommunityInput): Promise<GenerateCommunityOutput> {
  return generateCommunityFlow(input);
}

const generateCommunityPrompt = ai.definePrompt({
  name: 'generateCommunityPrompt',
  input: {schema: GenerateCommunityInputSchema},
  output: {schema: GenerateCommunityOutputSchema},
  prompt: `You are an expert at founding online communities. Based on the user's prompt, generate a name, a short description, and a welcome message for their new community.

User Prompt: {{{prompt}}}

Generate a response that is creative, inviting, and directly related to the user's prompt.`,
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
