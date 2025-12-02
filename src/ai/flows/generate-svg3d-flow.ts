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

type GenerateSvg3dOutput = {
  svg: string;
};

export async function generateSvg3d(
  input: GenerateSvg3dInput
): Promise<GenerateSvg3dOutput> {
  return generateSvg3dFlow(input);
}

const generateSvg3dPrompt = ai.definePrompt({
  name: 'generateSvg3dPrompt',
  input: { schema: z.any() },
  output: { schema: z.object({ svg: z.string().describe('The generated SVG string.') }) },
  prompt: `You are an expert vector artist who understands sacred geometry and the concept of SVG3D. Your task is to generate SVG content that will be placed inside an interactive 3D canvas.

The SVG3D Concept:
- You are creating elements within a 3D coordinate system (let's call it "PosSys"). The center of this system (0,0,0) is the "heart".
- Your design should evoke a feeling of infinite creation expanding outwards from this central heart.
- You can represent the user's prompt theme by placing simple, abstract, symbolic shapes (spheres, lines, geometric forms) or a cloud of 'ColorPixels' within the 3D space.
- The user will be able to rotate this 3D space, so your design should be interesting from all angles.

Your Task:
1.  Generate a complete, valid SVG string. The final SVG will be placed inside a container with a viewBox of "0 0 {{width}} {{height}}", so your content should be positioned relative to that.
2.  Do NOT draw a cube or pyramids. Those were just metaphors. Your job is to create the content that lives *inside* the 3D space.
3.  The design must be purely symbolic and geometric. DO NOT include text.
4.  Use the user's prompt to inspire the color palette, shapes, and overall feeling of the design.
5.  Your response must be ONLY the raw SVG code, starting with '<svg' and ending with '</svg>'. Do not wrap it in markdown.

User Prompt: "{{prompt}}"
`,
});

const generateSvg3dFlow = ai.defineFlow(
  {
    name: 'generateSvg3dFlow',
    inputSchema: z.any(),
    outputSchema: z.object({ svg: z.string() }),
  },
  async (input) => {
    const { output } = await generateSvg3dPrompt(input);
    if (!output?.svg) {
        throw new Error("The AI failed to generate an SVG string.");
    }
    return { svg: output.svg };
  }
);
