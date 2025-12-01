'use server';
/**
 * @fileOverview Translates a story from a source language to a target language and generates an audio file.
 *
 * - translateStory - A function that handles the story translation and audio generation process.
 * - TranslateStoryInput - The input type for the translateStory function.
 * - TranslateStoryOutput - The return type for the translateStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateSpeech } from '@/ai/flows/generate-speech';

const TranslateStoryInputSchema = z.object({
  storyText: z.string().describe('The story text in the source language.'),
  sourceLanguage: z.string().describe('The source language of the story.'),
  targetLanguage: z.string().describe('The target language to translate the story to.'),
});
export type TranslateStoryInput = z.infer<typeof TranslateStoryInputSchema>;

const TranslateStoryOutputSchema = z.object({
  translatedText: z.string().describe('The translated story text.'),
  audioDataUri: z.string().describe('The audio data URI of the translated story.'),
});
export type TranslateStoryOutput = z.infer<typeof TranslateStoryOutputSchema>;

export async function translateStory(input: TranslateStoryInput): Promise<TranslateStoryOutput> {
  return translateStoryFlow(input);
}

const TranslatedStorySchema = z.object({
  translatedText: z.string().describe('The translated story text.'),
});

const translateStoryPrompt = ai.definePrompt({
  name: 'translateStoryPrompt',
  input: {schema: TranslateStoryInputSchema},
  output: {schema: TranslatedStorySchema},
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
        return { translatedText: '', audioDataUri: '' };
    }
    const speechResult = await generateSpeech({ text: translatedText });
    return {translatedText: translatedText, audioDataUri: speechResult.media};
  }
);
