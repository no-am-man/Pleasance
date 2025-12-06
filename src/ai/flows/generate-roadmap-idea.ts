
'use server';
/**
 * @fileOverview A flow to generate a new roadmap card idea from a simple prompt.
 *
 * - generateRoadmapIdea - A function that takes a prompt and generates a full card.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateRoadmapIdeaOutputSchema } from '@/lib/types';
import type { GenerateRoadmapIdeaOutput } from '@/lib/types';

const GenerateIdeaInputSchema = z.object({
  prompt: z.string().describe('The user\'s core idea or prompt.'),
});
type GenerateIdeaInput = z.infer<typeof GenerateIdeaInputSchema>;


export async function generateRoadmapIdea(input: GenerateIdeaInput): Promise<GenerateRoadmapIdeaOutput> {
  return generateRoadmapIdeaFlow(input);
}


const generateIdeaPrompt = ai.definePrompt({
    name: 'generateRoadmapIdeaPrompt',
    input: { schema: GenerateIdeaInputSchema },
    output: { schema: GenerateRoadmapIdeaOutputSchema },
    config: {
        model: "googleai/gemini-1.5-flash-001",
    },
    prompt: `You are an expert product manager. Your task is to take a user's raw idea and expand it into a well-defined roadmap card.

The output should be a JSON object with a title, a detailed description, and an array of relevant tags. The title should be concise and action-oriented. The description should clearly explain the "what" and the "why" of the feature for a public audience. The tags should be 2-3 relevant keywords.

User's Idea: "{{prompt}}"

Generate a single roadmap card.
`,
});


const generateRoadmapIdeaFlow = ai.defineFlow(
  {
    name: 'generateRoadmapIdeaFlow',
    inputSchema: GenerateIdeaInputSchema,
    outputSchema: GenerateRoadmapIdeaOutputSchema,
  },
  async (input) => {
    const { output } = await generateIdeaPrompt(input);
    if (!output) {
        throw new Error("The AI failed to generate a roadmap idea.");
    }
    return output;
  }
);
