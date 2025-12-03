
'use server';
/**
 * @fileOverview Translates a story from a source language to a target language.
 *
 * - translateStory - A function that handles the story translation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateStoryInputSchema = z.object({
  storyText: z.string().describe('The story text in the source language.'),
  sourceLanguage: z.string().describe('The source language of the story.'),
  targetLanguage: z.string().describe('The target language to translate the story to.'),
});
type TranslateStoryInput = z.infer<typeof TranslateStoryInputSchema>;

const TranslateStoryOutputSchema = z.object({
  translatedText: z.string().describe('The translated story text.'),
});

export async function translateStory(input: TranslateStoryInput): Promise<z.infer<typeof TranslateStoryOutputSchema>> {
  return translateStoryFlow(input);
}

const translateStoryPrompt = ai.definePrompt({
  name: 'translateStoryPrompt',
  input: {schema: TranslateStoryInputSchema},
  output: {schema: TranslateStoryOutputSchema},
  config: {
    model: 'googleai/gemini-pro',
  },
  prompt: `Translate the following story from {{sourceLanguage}} to {{targetLanguage}}:\n\n{{{storyText}}}`,
});

const translateStoryFlow = ai.defineFlow(
  {
    name: 'translateStoryFlow',
    inputSchema: TranslateStoryInputSchema,
    outputSchema: TranslateStoryOutputSchema,
  },
  async input => {
    const {output} = await translateStoryPrompt(input);
    
    // Ensure we always return a valid object, even if the AI returns nothing.
    const translatedText = output?.translatedText || '';

    if (translatedText.trim() === '') {
        // Explicitly return an empty string in the correct schema format.
        // The calling action will handle this as a failure case.
        return { translatedText: '' };
    }
    
    return { translatedText };
  }
);
