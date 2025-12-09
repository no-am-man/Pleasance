// src/ai/flows/refine-community-prompt.ts
'use server';
/**
 * @fileOverview A flow to refine a user's community prompt using AI.
 *
 * - refineCommunityPrompt - A function that takes a rough idea and expands it.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GEMINI_PRO } from '@/config/models';

const RefinePromptInputSchema = z.object({
  prompt: z.string().describe('The rough prompt for a community to be refined.'),
});
type RefinePromptInput = z.infer<typeof RefinePromptInputSchema>;

const RefinePromptOutputSchema = z.object({
  refinedPrompt: z.string().describe('The detailed, AI-generated prompt for creating a community.'),
});
export type RefinePromptOutput = z.infer<typeof RefinePromptOutputSchema>;


export async function refineCommunityPrompt(input: RefinePromptInput): Promise<RefinePromptOutput> {
  return refineCommunityPromptFlow(input);
}


const refinePromptGenkit = ai.definePrompt({
    name: 'refineCommunityPrompt',
    input: { schema: RefinePromptInputSchema },
    output: { schema: RefinePromptOutputSchema },
    prompt: `You are an expert community builder. Your task is to take a user's rough idea and expand it into a detailed, evocative prompt. This new prompt will be fed into another AI to generate a community name, description, welcome message, and AI members.

The refined prompt should be rich with detail, suggesting themes, tones, and potential member archetypes.

User's Idea: "{{prompt}}"

Generate a refined prompt that will inspire the creation of a vibrant and unique community. The output should be just the refined prompt text.
`,
});


const refineCommunityPromptFlow = ai.defineFlow(
  {
    name: 'refineCommunityPromptFlow',
    inputSchema: RefinePromptInputSchema,
    outputSchema: RefinePromptOutputSchema,
  },
  async (input) => {
    const { output } = await refinePromptGenkit(input, { model: GEMINI_PRO });
    
    if (!output) {
        throw new Error("The AI failed to generate a refined prompt.");
    }
    return output;
  }
);
