
'use server';
/**
 * @fileOverview A flow to generate abstract avatars for user profiles.
 *
 * - generateProfileAvatars - A function that generates a set of abstract avatars.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { IMAGEN } from '@/config/models';

const GenerateAvatarsInputSchema = z.object({
  name: z.string().describe('The name of the user, to be used as a seed for the avatar style.'),
});
type GenerateAvatarsInput = z.infer<typeof GenerateAvatarsInputSchema>;

const GenerateAvatarsOutputSchema = z.object({
  avatars: z.array(z.string()).describe('A list of generated avatar images as data URIs.'),
});

export async function generateProfileAvatars(input: GenerateAvatarsInput): Promise<{error?: string, avatars?: string[]}> {
    try {
        const result = await generateAvatarsFlow(input);
        return { avatars: result.avatars };
    } catch(e) {
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: message };
    }
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
                model: IMAGEN,
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
