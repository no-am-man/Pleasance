// src/ai/flows/generate-speech.ts
'use server';
/**
 * @fileOverview Generates speech from text using a specified voice.
 *
 * - generateSpeech - A function that generates speech from text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

const GenerateSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;

const GenerateSpeechOutputSchema = z.object({
  audioUrl: z.string().describe('A data URI of the generated WAV audio.'),
});

export async function generateSpeech(input: GenerateSpeechInput): Promise<{error?: string, audioUrl?: string}> {
  try {
    const result = await generateSpeechFlow(input);
    return { audioUrl: result.audioUrl };
  } catch(e) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
      return { error: message };
  }
}

// Helper function to convert raw PCM audio data to a WAV file data URI
async function toWav(pcmData: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({
            channels: 1, // The Gemini TTS model returns mono audio
            sampleRate: 24000, // The Gemini TTS model returns audio at a 24000Hz sample rate.
            bitDepth: 16 // The Gemini TTS model returns 16-bit PCM audio.
        });

        const bufs: any[] = [];
        writer.on('error', reject);
        writer.on('data', (d) => bufs.push(d));
        writer.on('end', () => {
            const wavBuffer = Buffer.concat(bufs);
            const base64Data = wavBuffer.toString('base64');
            resolve(`data:audio/wav;base64,${base64Data}`);
        });

        writer.write(pcmData);
        writer.end();
    });
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
    
    const audioUrl = await toWav(pcmBuffer);

    return { audioUrl };
  }
);
