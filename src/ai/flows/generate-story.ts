
// src/ai/flows/generate-story.ts
'use server';
/**
 * @fileOverview A flow to generate a short story based on a selected difficulty level.
 *
 * - generateStory - A function that generates the story.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStoryInputSchema = z.object({
  difficultyLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('The difficulty level of the story to generate.'),
  sourceLanguage: z.string().describe('The language the story should be written in.'),
});
type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const GenerateStoryOutputSchema = z.object({
  story: z.string().describe('The generated short story.'),
});

export async function generateStory(input: GenerateStoryInput): Promise<z.infer<typeof GenerateStoryOutputSchema>> {
  return generateStoryFlow(input);
}

const generateStoryPrompt = ai.definePrompt({
  name: 'generateStoryPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  config: {
    model: 'googleai/gemini-1.5-flash',
    safetySettings: [
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
        }
    ]
  },
  prompt: `You are a creative story writer. Write a short story in {{sourceLanguage}} for a {{difficultyLevel}} level language learner. The story should be engaging and suitable for language learning purposes.`,
});

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    const { output } = await generateStoryPrompt(input);
    
    if (!output) {
      throw new Error("AI failed to generate a story.");
    }
    
    return output;
  }
);
