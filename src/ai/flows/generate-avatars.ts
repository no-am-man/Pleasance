
'use server';
/**
 * @fileOverview A flow to generate abstract avatars for user profiles.
 *
 * - generateAvatars - A function that generates a set of abstract avatars.
 * - GenerateAvatarsInput - The input type for the generateAvatars function.
 * - GenerateAvatarsOutput - The return type for the generateAvatars function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAvatarsInputSchema = z.object({
  name: z.string().describe('The name of the user, to be used as a seed for the avatar style.'),
});
export type GenerateAvatarsInput = z.infer<typeof GenerateAvatarsInputSchema>;

const GenerateAvatarsOutputSchema = z.object({
  avatars: z.array(z.string()).describe('A list of generated avatar images as data URIs.'),
});
export type GenerateAvatarsOutput = z.infer<typeof GenerateAvatarsOutputSchema>;

export async function generateAvatars(input: GenerateAvatarsInput): Promise<GenerateAvatarsOutput> {
  return generateAvatarsFlow(input);
}

const generateAvatarsFlow = ai.defineFlow(
  {
    name: 'generateAvatarsFlow',
    inputSchema: GenerateAvatarsInputSchema,
    outputSchema: GenerateAvatarsOutputSchema,
  },
  async (input) => {
    const avatarCount = 4;
    const promises = [];

    for (let i = 0; i < avatarCount; i++) {
        const prompt = `Generate an abstract, artistic, and unique avatar representing the name "${input.name}". Style: vibrant, geometric, digital art, with a sense of cosmic wonder. Variation ${i + 1}.`;
        
        promises.push(
            ai.generate({
                model: 'googleai/imagen-4.0-fast-generate-001',
                prompt: prompt,
                config: {
                    aspectRatio: "1:1",
                },
            })
        );
    }
    
    const results = await Promise.all(promises);
    const avatars = results.map(result => result.media.url);

    return { avatars };
  }
);
