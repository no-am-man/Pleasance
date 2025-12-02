
'use server';
/**
 * @fileOverview Generates speech from text using a specified voice.
 *
 * - generateSpeech - A function that generates speech from text.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const GenerateSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;

const GenerateSpeechOutputSchema = z.object({
  audioUrl: z.string().describe('A data URI of the generated raw PCM audio data.'),
});

export async function generateSpeech(input: GenerateSpeechInput): Promise<z.infer<typeof GenerateSpeechOutputSchema>> {
  return generateSpeechFlow(input);
}

const generateSpeechFlow = ai.defineFlow(
  {
    name: 'generateSpeechFlow',
    inputSchema: GenerateSpeechInputSchema,
    outputSchema: GenerateSpeechOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      prompt: input.text,
      config: {
        responseModalities: ['AUDIO'],
      },
    });

    if (!media) {
      throw new Error('AI did not return any media for speech generation.');
    }
    
    return {
      audioUrl: media.url, // The model returns a data:audio/pcm;base64,... URI directly
    };
  }
);
