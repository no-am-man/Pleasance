
'use server';
/**
 * @fileOverview Generates a story in two languages with vocabulary.
 *
 * - generateDualStory - The server action to generate the dual-language story.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { StorySchema } from '@/lib/types';
import type { StorySchema as StoryDataType } from '@/lib/types';

const GenerateDualStoryInputSchema = z.object({
  prompt: z.string().describe("A simple prompt or theme for the story."),
  targetLanguage: z.string().describe("The primary language for the story (e.g., 'Spanish', 'French')."),
});

export async function generateDualStory(
  input: z.infer<typeof GenerateDualStoryInputSchema>
): Promise<StoryDataType> {
  return generateDualStoryFlow(input);
}

const dualStoryPrompt = ai.definePrompt({
    name: 'generateDualStoryPrompt',
    input: { schema: GenerateDualStoryInputSchema },
    output: { schema: StorySchema },
    config: {
        model: "googleai/gemini-1.5-flash-001",
    },
    prompt: `You are an expert storyteller and language teacher. Create a short, simple, and engaging story based on the user's prompt.
    The story should be suitable for a beginner to intermediate language learner.

    Your task is to generate a JSON object that strictly adheres to the provided schema.

    1.  **titleOriginal**: Write a creative title for the story in {{targetLanguage}}.
    2.  **titleTranslated**: Translate that title into English.
    3.  **contentOriginal**: Write the full story in {{targetLanguage}}. It should be 3-5 paragraphs long.
    4.  **contentTranslated**: Provide a precise English translation of the story.
    5.  **vocabulary**: Extract 5-7 key vocabulary words from the {{targetLanguage}} story. For each word, provide its English translation and the context sentence where it was used.

    User Prompt: "{{prompt}}"

    Generate the story. The entire output must be a single, raw JSON object.
    `,
});


const generateDualStoryFlow = ai.defineFlow(
  {
    name: 'generateDualStoryFlow',
    inputSchema: GenerateDualStoryInputSchema,
    outputSchema: StorySchema,
  },
  async (input) => {
    const { output } = await dualStoryPrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a story.");
    }
    return output;
  }
);
