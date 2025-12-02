
'use server';
/**
 * @fileOverview A flow to generate a 3D point cloud for an SVG.
 *
 * - generateSvg3d - A function that generates the point cloud data.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  GenerateSvg3dInputSchema,
  ColorPixelSchema
} from '@/lib/types';
import type { GenerateSvg3dInput } from '@/lib/types';


const Svg3dOutputSchema = z.object({
    pixels: z.array(ColorPixelSchema)
});
type Svg3dOutput = z.infer<typeof Svg3dOutputSchema>;


export async function generateSvg3d(values: GenerateSvg3dInput): Promise<Svg3dOutput> {
    const prompt = `You are a digital artist who creates 3D point clouds. Generate a JSON object with a 'pixels' property containing an array of 'ColorPixel' objects based on the user's request.

- The user wants to create a point cloud representing: "${values.prompt}"
- The conceptual cube size is ${values.cubeSize}mm.
- The requested pixel density is ${values.density}.

Your task is to generate the array of pixels.
- The number of points should reflect the requested density:
  - Low: ~300-500 points
  - Medium: ~800-1500 points
  - High: ~2000-3000 points
- All coordinates (x, y, z) must be within a -50 to 50 range.
- Use the prompt to inspire the shape, color, and structure of the point cloud.
- Your entire response MUST be only the JSON object. Do not include any other text, explanations, or markdown.`;

    const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-pro-preview',
        prompt: prompt,
        output: {
            format: 'json',
            schema: Svg3dOutputSchema,
        },
    });

    if (!output) {
        throw new Error('Could not generate SVG3D image from the AI.');
    }
    return output;
}
