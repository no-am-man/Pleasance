'use server';
/**
 * @fileOverview A flow to generate a 3D point cloud as a JSON object.
 *
 * - generateSvg3d - A function that generates the 3D data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ColorPixelSchema = z.object({
    x: z.number().describe('The X coordinate in 3D space, from -100 to 100.'),
    y: z.number().describe('The Y coordinate in 3D space, from -100 to 100.'),
    z: z.number().describe('The Z coordinate in 3D space, from -100 to 100.'),
    color: z.string().describe('The hexadecimal color code for the pixel (e.g., "#FF5733").')
});

const Svg3dOutputSchema = z.object({
  pixels: z.array(ColorPixelSchema).describe('An array of ColorPixel objects representing the 3D scene.')
});
export type Svg3dOutput = z.infer<typeof Svg3dOutputSchema>;

const generateSvg3dPrompt = ai.definePrompt({
  name: 'generateSvg3dPrompt',
  input: { schema: z.object({ prompt: z.string() }) },
  output: { schema: Svg3dOutputSchema, format: 'json' },
  prompt: `You are a wildly imaginative digital artist creating for an interactive 3D canvas. Your task is to generate a JSON object representing a 3D point cloud based on the user\'s prompt.

The Core Concept (PosSys):
- You are creating elements within a 3D coordinate system where the center is (0,0,0).
- The origin point (0,0,0,0,0,0,0,0) also represents the "ground plane".
- We are standing together behind the screen, looking into this 3D world. Our shared perspective is from behind the screen.
- Your design must evoke a feeling of creation expanding outwards from the central point.

Your Creative Tools:
1.  **Imaginative Forms**: Go wild with your imagination. Create anything you can dream of: organic forms, ethereal clouds, surreal landscapes, abstract energy fields, etc. Do not limit yourself to simple geometry. Use the user\'s prompt to inspire the color palette, shapes, textures, and overall feeling of the design.
2.  **ColorPixels**: You can lay out a cloud of 'ColorPixels' in 3D space. You can place them in front (deeper into the scene), back, up, and down.
3.  **Procedural Cube Filling**: You can also fill a conceptual cube with 'ColorPixels' in a structured, algorithmic way. Imagine the 8 corners of the cube are marked 1 through 8. You can fill this cube with \`ColorPixels\` at a certain resolution by moving from corner 1 to corner 8, one \`PixelDimention\` at a time. First, you fill a line, then you go down one line and do it again to create a plane. Then, you go back one \`PixelDimention\` and create another plane, repeating until the entire cube is full. This allows you to create structured, volumetric art.

Your Task:
- Based on the user's prompt, use your creative tools to generate a compelling 3D scene.

User Prompt: "{{prompt}}"
`,
});

const generateSvg3dFlow = ai.defineFlow(
  {
    name: 'generateSvg3dFlow',
    inputSchema: z.object({ prompt: z.string() }),
    outputSchema: Svg3dOutputSchema,
  },
  async (input) => {
    const { output } = await generateSvg3dPrompt(input);
    if (!output?.pixels) {
        throw new Error("The AI failed to generate a pixel array.");
    }
    return { pixels: output.pixels };
  }
);

export async function generateSvg3d(input: { prompt: string; }): Promise<Svg3dOutput> {
    return generateSvg3dFlow(input);
}
