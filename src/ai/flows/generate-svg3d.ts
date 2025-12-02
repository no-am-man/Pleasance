
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
export type Svg3dOutput = z.infer<typeof Svg3dOutputSchema>;

export async function generateSvg3d(input: GenerateSvg3dInput): Promise<Svg3dOutput> {
  return generateSvg3dFlow(input);
}

const generateSvg3dPrompt = ai.definePrompt({
    name: 'generateSvg3dPrompt',
    model: 'googleai/gemini-pro',
    input: { schema: GenerateSvg3dInputSchema },
    output: { schema: Svg3dOutputSchema },
    prompt: `You are a digital artist who creates 3D point clouds. Generate a JSON object with a 'pixels' property containing an array of 'ColorPixel' objects based on the user's request.

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
- Your entire response MUST be only the raw JSON object adhering to the schema. Do not include any other text, explanations, or markdown formatting like \`\`\`json.`,
});


const generateSvg3dFlow = ai.defineFlow(
  {
    name: 'generateSvg3dFlow',
    inputSchema: GenerateSvg3dInputSchema,
    outputSchema: Svg3dOutputSchema,
  },
  async (input) => {
    const { output } = await generateSvg3dPrompt(input);
    if (!output) {
        throw new Error("The AI failed to generate a response.");
    }
    return output;
  }
);
