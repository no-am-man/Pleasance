
'use server';
/**
 * @fileOverview A generic flow to translate a piece of text.
 *
 * - translateText - A function that handles the translation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The target language for the translation (e.g., "Hebrew", "English").'),
});

const TranslateTextOutputSchema = z.object({
  translation: z.string().describe('The translated text.'),
});

export async function translateText(
  input: z.infer<typeof TranslateTextInputSchema>
): Promise<z.infer<typeof TranslateTextOutputSchema>> {
  return translateTextFlow(input);
}

// The flow is now self-contained and explicitly calls the model.
const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    if (!input.text.trim()) {
      return { translation: '' };
    }

    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-001', // Using the specific model string that works in other flows
      prompt: `Translate the following text to ${input.targetLanguage}. Return only the translated text, with no additional commentary or formatting.

Text to translate:
"${input.text}"`,
      output: {
        schema: TranslateTextOutputSchema,
      },
    });

    return output || { translation: input.text };
  }
);
