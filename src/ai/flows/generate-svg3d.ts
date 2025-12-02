
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

const generateSvg3dFlow = ai.defineFlow(
  {
    name: 'generateSvg3dFlow',
    inputSchema: GenerateSvg3dInputSchema,
    outputSchema: Svg3dOutputSchema,
  },
  async (input) => {
    const prompt = `You are a digital artist who creates 3D point clouds. Generate a JSON object with a 'pixels' property containing an array of 'ColorPixel' objects based on the user's request.

- The user wants to create a point cloud representing: "${input.prompt}"
- The conceptual cube size is ${input.cubeSize}mm.
- The requested pixel density is ${input.density}.

Your task is to generate the array of pixels.
- The number of points should reflect the requested density:
  - Low: ~300-500 points
  - Medium: ~800-1500 points
  - High: ~2000-3000 points
- All coordinates (x, y, z) must be within a -50 to 50 range.
- Use the prompt to inspire the shape, color, and structure of the point cloud.
- Your entire response MUST be only the raw JSON object adhering to the schema. Do not include any other text, explanations, or markdown formatting like \`\`\`json.`;

    const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: prompt,
        config: {
            responseMIMEType: 'application/json',
        }
    });

    if (!output) {
      throw new Error('Could not generate SVG3D image from the AI.');
    }
    
    // The model should return a JSON string, so we parse it.
    const responseText = output.text;
    if (!responseText) {
        throw new Error('AI returned an empty response.');
    }

    try {
        const parsedJson = JSON.parse(responseText);
        // Validate the parsed JSON against our Zod schema
        const validatedOutput = Svg3dOutputSchema.parse(parsedJson);
        return validatedOutput;
    } catch (e) {
        console.error("Failed to parse or validate AI's JSON response:", e);
        console.error("Raw AI Response:", responseText);
        throw new Error("The AI returned invalid JSON. Please try again.");
    }
  }
);
