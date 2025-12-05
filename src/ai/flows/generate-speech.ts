
'use server';
/**
 * @fileOverview Generates speech from text using a specified voice.
 *
 * - generateSpeech - A function that generates speech from text.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { WaveFile } from 'wavefile';

const GenerateSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;

const GenerateSpeechOutputSchema = z.object({
  audioUrl: z.string().describe('A data URI of the generated WAV audio.'),
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
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
    });

    if (!media?.url) {
      throw new Error('AI did not return any media for speech generation.');
    }
    
    const pcmBase64 = media.url.substring(media.url.indexOf(',') + 1);
    const pcmBuffer = Buffer.from(pcmBase64, 'base64');
    
    // Use wavefile to create a proper WAV file from raw PCM data
    const wav = new WaveFile();
    wav.fromScratch(1, 24000, '16', pcmBuffer);
    const wavBuffer = wav.toBuffer();
    const wavData = wavBuffer.toString('base64');

    return {
      audioUrl: `data:audio/wav;base64,${wavData}`,
    };
  }
);
