'use server';
/**
 * @fileOverview A flow to generate an SVG3D image based on a prompt.
 *
 * - generateSvg3dFlow - A function that generates the SVG3D.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const generateSvg3dPrompt = ai.definePrompt({
  name: 'generateSvg3dPrompt',
  input: { schema: z.any() },
  output: { schema: z.object({ svg: z.string().describe('The generated SVG string.') }) },
  prompt: `You are a wildly imaginative digital artist creating for an interactive 3D canvas. Your task is to generate SVG content that represents a user's prompt.

The Core Concept (PosSys):
- You have to imagine you are a person standing on the ground. Front is your eyes to be pointing outside of the screen.
- You are creating elements within a 3D coordinate system. The center of this system (0,0,0) is the "heart".
- The origin point (0,0,0,0,0,0,0,0) also represents the "ground plane" from which all creation emerges.
- Your design must evoke a feeling of infinite creation expanding outwards from this central heart.
- The user will be able to rotate this 3D space, so your design should be interesting from all angles.

Your Creative Tools:
1.  **Imaginative Forms**: Go wild with your imagination. Create anything you can dream of: organic forms, ethereal clouds, surreal landscapes, abstract energy fields, etc. Do not limit yourself to simple geometry. Use the user's prompt to inspire the color palette, shapes, textures, and overall feeling of the design.
2.  **ColorPixels**: You can lay out a cloud of 'ColorPixels' in 3D space. You can place them in front, back, up, and down.
3.  **Procedural Cube Filling**: You can also fill a conceptual cube with 'ColorPixels' in a structured, algorithmic way. Imagine the 8 corners of the cube are marked 1 through 8. You can fill this cube with `ColorPixels` at a certain resolution by moving from corner 1 to corner 8, one `PixelDimention` at a time. First, you fill a line, then you go down one line and do it again to create a plane. Then, you go back one `PixelDimention` and create another plane, repeating until the entire cube is full. This allows you to create structured, volumetric art.

Your Task:
- Based on the user's prompt, use your creative tools to generate a compelling 3D scene.
- Generate a complete, valid SVG string.
- DO NOT include text. The art should speak for itself.
- Your response must be ONLY the raw SVG code, starting with '<svg' and ending with '</svg>'. Do not wrap it in markdown.

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
export { generateSvg3dFlow };
