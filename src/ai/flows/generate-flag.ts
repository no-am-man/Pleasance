
'use server';
/**
 * @fileOverview A flow to generate a community flag as an SVG string.
 *
 * - generateFlag - A function that generates an SVG flag.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFlagInputSchema = z.object({
  communityName: z.string().describe('The name of the community.'),
  communityDescription: z.string().describe('The description of the community.'),
});
type GenerateFlagInput = z.infer<typeof GenerateFlagInputSchema>;

const GenerateFlagOutputSchema = z.object({
  svg: z.string().describe('The complete, valid SVG string for the generated flag. The SVG should have a 16:9 aspect ratio (e.g., viewBox="0 0 160 90"). The design must be abstract and symbolic, containing no text. Use a professional, 2-3 color palette. The entire response must be only the raw JSON object adhering to the schema.'),
});

export async function generateFlag(input: GenerateFlagInput): Promise<z.infer<typeof GenerateFlagOutputSchema>> {
  return generateFlagFlow(input);
}

const generateFlagPrompt = ai.definePrompt(
  {
    name: 'generateFlagPrompt',
    input: { schema: GenerateFlagInputSchema },
    output: { schema: GenerateFlagOutputSchema },
    config: {
      model: 'googleai/gemini-pro',
    },
    prompt: `You are an expert graphic designer who specializes in creating symbolic, minimalist, and modern vector art for flags.

Task: Generate a complete, valid SVG string for a flag representing an online community.

Community Name: "{{communityName}}"
Community Description: "{{communityDescription}}"

Your ENTIRE response MUST be ONLY the raw JSON object adhering to the output schema.`,
  }
);


const generateFlagFlow = ai.defineFlow(
  {
    name: 'generateFlagFlow',
    inputSchema: GenerateFlagInputSchema,
    outputSchema: GenerateFlagOutputSchema,
  },
  async (input) => {
    const { output } = await generateFlagPrompt(input);
    if (!output || !output.svg) {
      throw new Error("The AI failed to generate a valid SVG string in the expected format.");
    }
    return output;
  }
);
