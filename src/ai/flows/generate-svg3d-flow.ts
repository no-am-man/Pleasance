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
export type ColorPixel = z.infer<typeof ColorPixelSchema>;

const Svg3dOutputSchema = z.array(ColorPixelSchema).describe('An array of ColorPixel objects representing the 3D scene.');
export type Svg3dOutput = z.infer<typeof Svg3dOutputSchema>;


const generateSvg3dPrompt = ai.definePrompt({
  name: 'generateSvg3dPrompt',
  input: { schema: z.object({ prompt: z.string() }) },
  output: { schema: Svg3dOutputSchema, format: 'json' },
  prompt: `You are a digital artist who creates 3D point clouds. Generate a JSON array of 'ColorPixel' objects representing a 3D point cloud based on the user's prompt. The origin (0,0,0) is the center.

User Prompt: "{{{prompt}}}"
`,
});

export async function generateSvg3dFlow(input: { prompt: string }): Promise<Svg3dOutput> {
    const { output } = await generateSvg3dPrompt(input);
    if (!output) {
        throw new Error("The AI failed to generate a pixel array.");
    }
    return output;
}
