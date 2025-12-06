
'use server';
/**
 * @fileOverview A generic flow to translate a piece of text.
 *
 * - translateText - A function that handles the translation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

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

const translateTextPrompt = ai.definePrompt(
  {
    name: 'translateTextPrompt',
    input: { schema: TranslateTextInputSchema },
    output: { schema: TranslateTextOutputSchema },
    config: {
      model: 'googleai/gemini-1.5-flash-001',
    },
    prompt: `Translate the following text to {{targetLanguage}}. Return only the translated text, with no additional commentary or formatting.

Text to translate:
"{{{text}}}"`,
  },
);

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
    
    // Explicitly call ai.generate with the prompt's details
    const { output } = await ai.generate({
        prompt: translateTextPrompt.prompt,
        model: translateTextPrompt.config.model,
        input: input,
        output: { schema: translateTextPrompt.output?.schema },
    });

    return output || { translation: input.text };
  }
);
