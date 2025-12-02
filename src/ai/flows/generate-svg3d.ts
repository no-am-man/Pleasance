'use server';
/**
 * @fileOverview A flow to generate a 3D point cloud for an SVG.
 *
 * - generateSvg3d - A function that generates the point cloud data.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  GenerateSvg3dInputSchema,
  ColorPixelSchema
} from '@/lib/types';

const Svg3dOutputSchema = z.array(ColorPixelSchema);

export async function generateSvg3d(values: z.infer<typeof GenerateSvg3dInputSchema>) {
    const { output } = await generateSvg3dPrompt(values);
    
    if (!output) {
        throw new Error('Could not generate SVG3D image from the AI.');
    }
    return { pixels: output };
}


const generateSvg3dPrompt = ai.definePrompt(
  {
    name: 'generateSvg3dPrompt',
    input: { schema: GenerateSvg3dInputSchema },
    output: { schema: Svg3dOutputSchema },
    prompt: `You are a digital artist who creates 3D point clouds. Generate a JSON array of 'ColorPixel' objects based on the user's request.

- The user wants to create a point cloud representing: "{{prompt}}"
- The conceptual cube size is {{cubeSize}}mm.
- The requested pixel density is {{density}}.

Your task is to generate the array of pixels.
- The number of points should reflect the requested density:
  - Low: ~300-500 points
  - Medium: ~800-1500 points
  - High: ~2000-3000 points
- All coordinates (x, y, z) must be within a -50 to 50 range.
- Use the prompt to inspire the shape, color, and structure of the point cloud.
- Your entire response MUST be only the JSON array. Do not include any other text, explanations, or markdown.`,
  },
);
