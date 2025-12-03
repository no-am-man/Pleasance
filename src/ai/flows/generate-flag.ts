
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
  svg: z.string().describe('The complete, valid SVG string for the generated flag.'),
});

export async function generateFlag(input: GenerateFlagInput): Promise<z.infer<typeof GenerateFlagOutputSchema>> {
  return generateFlagFlow(input);
}

const generateFlagFlow = ai.defineFlow(
  {
    name: 'generateFlagFlow',
    inputSchema: GenerateFlagInputSchema,
    outputSchema: GenerateFlagOutputSchema,
  },
  async (input) => {
    const promptText = `You are an expert graphic designer who specializes in creating symbolic, minimalist, and modern vector art for flags.

Task: Generate a complete, valid SVG string for a flag representing an online community.

Community Name: "${input.communityName}"
Community Description: "${input.communityDescription}"

Requirements:
1.  The SVG must be a single, self-contained string.
2.  The SVG should have a 16:9 aspect ratio. A viewBox of "0 0 160 90" is ideal.
3.  The design must be abstract, geometric, and symbolic. DO NOT include any text, letters, or numbers.
4.  Use a modern, professional color palette. Use 2-3 harmonious colors.
5.  The background of the SVG should be a solid color.
6.  Your ENTIRE response MUST be ONLY the raw SVG code, starting with '<svg' and ending with '</svg>'. Do not include any other text, explanations, or markdown formatting like \`\`\`json or \`\`\`xml.

Example of a good response format:
<svg width="160" height="90" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">...</svg>

Now, generate the SVG based on the provided community details.`;

    const { output } = await ai.generate({
        model: 'googleai/gemini-pro',
        prompt: promptText,
    });
    
    const svgText = output?.text || '';

    if (!svgText.startsWith('<svg')) {
        throw new Error("The AI failed to generate a valid SVG string.");
    }
    
    return { svg: svgText };
  }
);
