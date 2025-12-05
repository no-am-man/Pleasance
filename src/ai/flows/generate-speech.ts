
'use server';
/**
 * @fileOverview Generates speech from text using a specified voice.
 *
 * - generateSpeech - A function that generates speech from text.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

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
    
    // The model returns raw PCM audio as a data URI
    const pcmBase64 = media.url.split(',')[1];
    const pcmBuffer = Buffer.from(pcmBase64, 'base64');
    
    // Use wav package to convert PCM to WAV
    const wavData = await new Promise<string>((resolve, reject) => {
        const writer = new wav.Writer({
            channels: 1,
            sampleRate: 24000,
            bitDepth: 16,
        });

        const buffers: Buffer[] = [];
        writer.on('data', (chunk) => buffers.push(chunk));
        writer.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));
        writer.on('error', reject);

        writer.write(pcmBuffer);
        writer.end();
    });

    return {
      audioUrl: `data:audio/wav;base64,${wavData}`,
    };
  }
);
