
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

// Helper function to convert raw PCM to WAV format
async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({
            channels: channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        const bufs: any[] = [];
        writer.on('error', reject);
        writer.on('data', (d) => bufs.push(d));
        writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

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
      },
    });

    if (!media?.url) {
      throw new Error('AI did not return any media for speech generation.');
    }
    
    // The model returns raw PCM audio as a data URI
    const pcmBase64 = media.url.split(',')[1];
    const pcmBuffer = Buffer.from(pcmBase64, 'base64');
    
    // Convert the raw PCM buffer to a WAV buffer (as a base64 string)
    const wavBase64 = await toWav(pcmBuffer);

    return {
      audioUrl: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
