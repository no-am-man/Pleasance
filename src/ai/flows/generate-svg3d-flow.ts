'use server';
/**
 * @fileOverview A flow to generate a 3D point cloud as a JSON object.
 *
 * - generateSvg3dFlow - A function that generates the 3D data.
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

const generateSvg3dPrompt = ai.definePrompt({
  name: 'generateSvg3dPrompt',
  input: { schema: z.object({ prompt: z.string() }) },
  output: { schema: Svg3dOutputSchema },
  prompt: `You are a wildly imaginative digital artist creating for an interactive 3D canvas. Your task is to generate a JSON object representing a 3D point cloud based on the user's prompt.

The Core Concept (PosSys):
- You are creating elements within a 3D coordinate system where the center is (0,0,0).
- The origin point (0,0,0) also represents the "ground plane".
- You are a person standing on this ground, with your eyes pointing out of the screen.
- Your design must evoke a feeling of creation expanding outwards from this central point.

Your Task:
- Based on the user's prompt, generate a JSON array of "ColorPixels".
- Each pixel must have x, y, and z coordinates (between -100 and 100) and a hex color.
- Go wild with your imagination. Create anything: organic forms, ethereal clouds, surreal landscapes, abstract energy fields. Use the user's prompt to inspire the color palette and the 3D shapes you form with the pixels.
- Your response must be ONLY the valid JSON output.

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
export { generateSvg3dFlow };
