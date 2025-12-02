'use server';
/**
 * @fileOverview A flow to generate an SVG3D image based on a prompt.
 *
 * - generateSvg3d - A function that generates the SVG3D.
 * - GenerateSvg3dInput - The input type for the generateSvg3d function.
 * - GenerateSvg3dOutput - The return type for the generateSvg3d function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateSvg3dInputSchema = z.object({
  prompt: z.string().describe('The user prompt to inspire the SVG design.'),
  width: z.number().describe('The width of the SVG image.'),
  height: z.number().describe('The height of the SVG image.'),
});
export type GenerateSvg3dInput = z.infer<typeof GenerateSvg3dInputSchema>;

export const GenerateSvg3dOutputSchema = z.object({
  svg: z.string().describe('The generated SVG string.'),
});
export type GenerateSvg3dOutput = z.infer<typeof GenerateSvg3dOutputSchema>;

export async function generateSvg3d(
  input: GenerateSvg3dInput
): Promise<GenerateSvg3dOutput> {
  return generateSvg3dFlow(input);
}

const generateSvg3dPrompt = ai.definePrompt({
  name: 'generateSvg3dPrompt',
  input: { schema: GenerateSvg3dInputSchema },
  output: { schema: GenerateSvg3dOutputSchema },
  prompt: `You are an expert vector artist who understands sacred geometry. Your task is to generate an SVG image based on the "SVG3D" concept.

The SVG3D Concept:
- At the center of the image is a cube, representing a heart or core.
- From this central cube, 8 triangular pyramids expand outwards towards infinity along 8 3D vectors: Right-Front-Up, Right-Front-Down, Right-Back-Up, Right-Back-Down, Left-Front-Up, Left-Front-Down, Left-Back-Up, Left-Back-Down.
- The overall feeling should be one of infinite expansion and creation from a central point.

Your Task:
1.  Create a complete, valid SVG string with a viewBox of "0 0 {{width}} {{height}}".
2.  Render the central cube and the 8 expanding pyramids using perspective projection to give a 3D feel. Use lines and polygons.
3.  The design must be abstract and geometric. DO NOT include text.
4.  Subtly incorporate the theme of the user's prompt into the design. You can do this through the color palette, line styles (e.g., dashed, solid), or subtle background elements.
5.  Your response must be ONLY the raw SVG code, starting with '<svg' and ending with '</svg>'. Do not wrap it in markdown.

User Prompt: "{{prompt}}"
`,
});

const generateSvg3dFlow = ai.defineFlow(
  {
    name: 'generateSvg3dFlow',
    inputSchema: GenerateSvg3dInputSchema,
    outputSchema: GenerateSvg3dOutputSchema,
  },
  async (input) => {
    const { output } = await generateSvg3dPrompt(input);
    if (!output?.svg) {
        throw new Error("The AI failed to generate an SVG string.");
    }
    return { svg: output.svg };
  }
);
