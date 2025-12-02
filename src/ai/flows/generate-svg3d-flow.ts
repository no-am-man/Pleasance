
'use server';
/**
 * @fileOverview A flow to generate an SVG3D image based on a prompt.
 *
 * - generateSvg3d - A function that generates the SVG3D.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

type GenerateSvg3dInput = {
  prompt: string;
  width: number;
  height: number;
};

const GenerateSvg3dOutputSchema = z.object({
  svg: z.string().describe('The generated SVG string.'),
});
type GenerateSvg3dOutput = z.infer<typeof GenerateSvg3dOutputSchema>;

export async function generateSvg3d(
  input: GenerateSvg3dInput
): Promise<GenerateSvg3dOutput> {
  return generateSvg3dFlow(input);
}

const generateSvg3dPrompt = ai.definePrompt({
  name: 'generateSvg3dPrompt',
  input: { schema: z.any() },
  output: { schema: GenerateSvg3dOutputSchema },
  prompt: `You are an expert vector artist who understands sacred geometry. Your task is to generate an SVG image based on the "SVG3D" concept.

The SVG3D Concept:
- The image has a central cube, which represents a core or "heart". This cube has its own internal coordinate system called "PosSys".
- Inside this central cube, using the PosSys coordinate system, you can place simple symbolic shapes (like spheres, lines, or smaller geometric forms) that represent the core theme of the user's prompt.
- From the central cube, 8 triangular pyramids expand outwards towards infinity along 8 3D vectors. These represent the infinite expansion of the core theme.
- The overall feeling should be one of infinite creation expanding from a symbolic, central point.

Your Task:
1.  Create a complete, valid SVG string with a viewBox of "0 0 {{width}} {{height}}".
2.  Render the central cube and the 8 expanding pyramids using perspective projection.
3.  Inside the cube, place a simple, abstract, geometric representation of the user's prompt theme.
4.  Subtly incorporate the theme of the user's prompt into the overall design through the color palette and line styles.
5.  DO NOT include text. The design must be purely symbolic and geometric.
6.  Your response must be ONLY the raw SVG code, starting with '<svg' and ending with '</svg>'. Do not wrap it in markdown.

User Prompt: "{{prompt}}"
`,
});

const generateSvg3dFlow = ai.defineFlow(
  {
    name: 'generateSvg3dFlow',
    inputSchema: z.any(),
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
