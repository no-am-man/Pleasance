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
import wav from 'wav';

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

const translateStoryPrompt = ai.definePrompt({
  name: 'translateStoryPrompt',
  input: {schema: TranslateStoryInputSchema},
  output: {schema: z.string().describe('The translated story text.')},
  prompt: `Translate the following story from {{sourceLanguage}} to {{targetLanguage}}:\n\n{{{storyText}}}`,
});

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: z.string(),
    outputSchema: z.any(),
  },
  async (query) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: query,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const translateStoryFlow = ai.defineFlow(
  {
    name: 'translateStoryFlow',
    inputSchema: TranslateStoryInputSchema,
    outputSchema: TranslateStoryOutputSchema,
  },
  async input => {
    const {output: translatedText} = await translateStoryPrompt(input);
    if (!translatedText) {
        throw new Error('Failed to translate the story.');
    }
    const {media: audioDataUri} = await textToSpeechFlow(translatedText);
    return {translatedText: translatedText, audioDataUri: audioDataUri};
  }
);
