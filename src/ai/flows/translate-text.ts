// src/ai/flows/translate-text.ts
'use server';
/**
 * @fileOverview A generic flow to translate a piece of text.
 *
 * - translateText - A function that handles the translation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GEMINI_PRO } from '@/config/models';

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

const translatePrompt = ai.definePrompt({
    name: 'translateTextPrompt',
    input: { schema: TranslateTextInputSchema },
    output: { schema: TranslateTextOutputSchema },
    model: GEMINI_PRO,
    config: { 
        generationConfig: {
            responseMimeType: "application/json" 
        }
    },
    prompt: `Translate the following text to {{targetLanguage}}. Return only the translated text, with no additional commentary or formatting.

Text to translate:
"{{text}}"`,
});

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

    const { output } = await translatePrompt(input);

    return output || { translation: input.text };
  }
);