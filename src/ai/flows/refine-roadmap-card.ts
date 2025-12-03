
'use server';
/**
 * @fileOverview A flow to refine a roadmap card idea using AI.
 *
 * - refineRoadmapCard - A function that takes a title and generates a detailed description.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RefineCardInputSchema = z.object({
  title: z.string().describe('The title of the idea to be refined.'),
  description: z.string().optional().describe('An optional existing description to expand upon.'),
});
type RefineCardInput = z.infer<typeof RefineCardInputSchema>;

const RefineCardOutputSchema = z.object({
  refinedDescription: z.string().describe('The detailed, AI-generated description for the roadmap card.'),
});
export type RefineCardOutput = z.infer<typeof RefineCardOutputSchema>;


export async function refineRoadmapCard(input: RefineCardInput): Promise<RefineCardOutput> {
  return refineRoadmapCardFlow(input);
}


const refineCardPrompt = ai.definePrompt({
    name: 'refineRoadmapCardPrompt',
    input: { schema: RefineCardInputSchema },
    output: { schema: RefineCardOutputSchema },
    prompt: `You are an expert product manager. Your task is to take a raw idea title and an optional brief description and expand it into a clear, concise, and actionable description for a Kanban card.

The description should be suitable for a public roadmap, providing context for users and developers. Focus on the "what" and the "why".

Idea Title: "{{title}}"
{{#if description}}
Existing Description: "{{description}}"
{{/if}}

Generate a refined description. It should be a single paragraph.
`,
    config: {
        model: "gemini-pro",
    },
});


const refineRoadmapCardFlow = ai.defineFlow(
  {
    name: 'refineRoadmapCardFlow',
    inputSchema: RefineCardInputSchema,
    outputSchema: RefineCardOutputSchema,
  },
  async (input) => {
    const { output } = await refineCardPrompt(input);
    if (!output) {
        throw new Error("The AI failed to generate a refined description.");
    }
    return output;
  }
);
