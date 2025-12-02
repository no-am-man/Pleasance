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
export type Svg3dOutput = z.infer<typeof Svg3dOutputSchema>;

const generateSvg3dPrompt = ai.definePrompt({
  name: 'generateSvg3dPrompt',
  input: { schema: z.object({ prompt: z.string() }) },
  output: { schema: Svg3dOutputSchema, format: 'json' },
  prompt: `You are an imaginative digital artist. Your task is to generate a JSON object representing a 3D point cloud based on the user's prompt.

Our shared perspective is from behind the screen, looking into the 3D world. The origin point (0,0,0) is the center, and it also represents the "ground plane". Your design should evoke a feeling of creation expanding outwards from this central point.

Based on the user's prompt, generate an array of 'ColorPixel' objects. Each pixel should have x, y, and z coordinates (between -100 and 100) and a hex color code. Create a compelling and artistic 3D scene.

User Prompt: "{{{prompt}}}"
`,
});

export async function generateSvg3dFlow(input: { prompt: string }): Promise<Svg3dOutput> {
    const { output } = await generateSvg3dPrompt(input);
    if (!output?.pixels) {
        throw new Error("The AI failed to generate a pixel array.");
    }
    return { pixels: output.pixels };
}
