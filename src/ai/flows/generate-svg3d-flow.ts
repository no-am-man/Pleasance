'use server';
/**
 * @fileOverview A flow to generate a 3D point cloud as a JSON object.
 *
 * - generateSvg3dFlow - A function that generates the 3D data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ColorPixelSchema = z.object({
    x: z.number().describe('The X coordinate, from -50 to 50.'),
    y: z.number().describe('The Y coordinate, from -50 to 50.'),
    z: z.number().describe('The Z coordinate, from -50 to 50.'),
    color: z.string().describe('The hexadecimal color code (e.g., "#FF5733").')
});
export type ColorPixel = z.infer<typeof ColorPixelSchema>;

const Svg3dOutputSchema = z.array(ColorPixelSchema).describe('An array of ColorPixel objects representing the 3D scene.');
export type Svg3dOutput = z.infer<typeof Svg3dOutputSchema>;

export const GenerateSvg3dInputSchema = z.object({
  prompt: z.string(),
  cubeSize: z.number(),
  density: z.enum(['low', 'medium', 'high']),
});
export type GenerateSvg3dInput = z.infer<typeof GenerateSvg3dInputSchema>;


const generateSvg3dPrompt = ai.definePrompt({
  name: 'generateSvg3dPrompt',
  input: { schema: GenerateSvg3dInputSchema },
  output: { schema: Svg3dOutputSchema, format: 'json' },
  prompt: `You are a digital artist who creates 3D point clouds. Generate a JSON array of 'ColorPixel' objects based on the user's request.

User Prompt: "{{{prompt}}}"
Conceptual Cube Size: {{cubeSize}}mm
Pixel Density: {{density}}

- Generate points within a coordinate space from -50 to 50 on all axes.
- The number of points should reflect the requested density:
  - Low: ~300-500 points
  - Medium: ~800-1500 points
  - High: ~2000-3000 points
- Use the prompt to inspire the shape, color, and structure of the point cloud.
`,
});

export async function generateSvg3dFlow(input: GenerateSvg3dInput): Promise<Svg3dOutput> {
    const { output } = await generateSvg3dPrompt(input);
    if (!output) {
        throw new Error("The AI failed to generate a pixel array.");
    }
    return output;
}
