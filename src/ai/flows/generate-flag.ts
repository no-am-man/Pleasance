
'use server';
/**
 * @fileOverview A flow to generate a community flag.
 *
 * - generateFlag - A function that generates a flag image.
 * - GenerateFlagInput - The input type for the generateFlag function.
 * - GenerateFlagOutput - The return type for the generateFlag function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFlagInputSchema = z.object({
  communityName: z.string().describe('The name of the community.'),
  communityDescription: z.string().describe('The description of the community.'),
});
export type GenerateFlagInput = z.infer<typeof GenerateFlagInputSchema>;

const GenerateFlagOutputSchema = z.object({
  flagUrl: z.string().describe('The data URL of the generated flag image.'),
});
export type GenerateFlagOutput = z.infer<typeof GenerateFlagOutputSchema>;

export async function generateFlag(input: GenerateFlagInput): Promise<GenerateFlagOutput> {
  return generateFlagFlow(input);
}

const generateFlagFlow = ai.defineFlow(
  {
    name: 'generateFlagFlow',
    inputSchema: GenerateFlagInputSchema,
    outputSchema: GenerateFlagOutputSchema,
  },
  async (input) => {
    const prompt = `Generate a symbolic flag for an online community called "${input.communityName}".
The community is about: "${input.communityDescription}".
The flag should be abstract, emblematic, and suitable for a digital banner.
Style: minimalist, vector art, symbolic, with a clean and modern aesthetic. Avoid text.`;

    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: prompt,
      config: {
        aspectRatio: '16:9',
      },
    });

    return { flagUrl: media.url };
  }
);

    