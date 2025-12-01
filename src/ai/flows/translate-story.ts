'use server';
/**
 * @fileOverview Translates a story from a source language to a target language.
 *
 * - translateStory - A function that handles the story translation.
 * - TranslateStoryInput - The input type for the translateStory function.
 * - TranslateStoryOutput - The return type for the translateStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateStoryInputSchema = z.object({
  storyText: z.string().describe('The story text in the source language.'),
  sourceLanguage: z.string().describe('The source language of the story.'),
  targetLanguage: z.string().describe('The target language to translate the story to.'),
});
export type TranslateStoryInput = z.infer<typeof TranslateStoryInputSchema>;

const TranslateStoryOutputSchema = z.object({
  translatedText: z.string().describe('The translated story text.'),
});
export type TranslateStoryOutput = z.infer<typeof TranslateStoryOutputSchema>;

export async function translateStory(input: TranslateStoryInput): Promise<TranslateStoryOutput> {
  return translateStoryFlow(input);
}

const translateStoryPrompt = ai.definePrompt({
  name: 'translateStoryPrompt',
  input: {schema: TranslateStoryInputSchema},
  output: {schema: TranslateStoryOutputSchema},
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
    const translatedText = output?.translatedText || '';

    if (translatedText.trim() === '') {
        return { translatedText: '' };
    }
    
    return { translatedText };
  }
);
