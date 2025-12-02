'use server';
/**
 * @fileOverview Generates speech from text using a specified voice.
 *
 * - generateSpeech - A function that generates speech from text.
 * - GenerateSpeechInput - The input type for the generateSpeech function.
 * - GenerateSpeechOutput - The return type for the generateSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;

const GenerateSpeechOutputSchema = z.object({
  audioBase64: z.string().describe('The raw audio data in l16 format as a Base64-encoded string.'),
});
export type GenerateSpeechOutput = z.infer<typeof GenerateSpeechOutputSchema>;

export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
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
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: input.text,
    });

    if (!media) {
      throw new Error('AI did not return any media for speech generation.');
    }

    // Return the raw Base64 data directly from the AI response.
    // The format is 'data:audio/l16;rate=24000;base64,<encoded_data>'
    // We just need the encoded data part.
    const audioBase64 = media.url.substring(media.url.indexOf(',') + 1);
    
    return {
      audioBase64,
    };
  }
);
