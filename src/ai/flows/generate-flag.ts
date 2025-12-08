
// src/ai/flows/generate-flag.ts
'use server';
/**
 * @fileOverview A flow to generate a community flag SVG.
 * 
 * - generateCommunityFlag - The server action to generate the flag.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import admin from 'firebase-admin';

// 1. Schemas
const GenerateFlagInputSchema = z.object({
  communityName: z.string(),
  communityDescription: z.string(),
});

const GenerateFlagOutputSchema = z.object({
  svg: z.string().describe("A complete, valid SVG string. The SVG should be visually appealing, symbolic, and modern. It must be a single string of SVG code."),
});

const flagActionSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
    idToken: z.string(),
});

// 2. Genkit Prompt
const PROMPT_TEMPLATE = `You are an expert graphic designer who specializes in creating symbolic, minimalist, and modern vector art for flags.
        
Task: Generate a complete, valid SVG string for a flag representing an online community.

Community Name: "{{communityName}}"
Community Description: "{{communityDescription}}"

Design Constraints:
- The SVG must be a single, complete string.
- The design should be abstract and symbolic.
- Do not include any text in the SVG output.
- The SVG should look good on both light and dark backgrounds.
- Ensure the output is a raw JSON object containing the SVG string, with no additional text, explanations, or markdown formatting like \`\`\`json.`;


// 3. Dedicated Genkit Flow
const generateFlagFlow = ai.defineFlow(
  {
    name: 'generateFlagFlow',
    inputSchema: GenerateFlagInputSchema,
    outputSchema: GenerateFlagOutputSchema,
  },
  async (input) => {
    // IMPORTANT: This flow calls the Imagen model via Genkit. 
    // The service account running this code (or the user's ADC for local dev) 
    // MUST have the "Vertex AI User" IAM role in the Google Cloud project.
    // Failure to grant this role will result in a PERMISSION_DENIED gRPC error.
    const { output } = await ai.generate({
        prompt: PROMPT_TEMPLATE,
        model: 'googleai/gemini-1.5-pro-preview-0514',
        input,
        output: { schema: GenerateFlagOutputSchema },
    });
    
    if (!output) {
      throw new Error('AI failed to generate a flag SVG.');
    }
    return output;
  }
);


// 4. Server Action (The main entry point called by the client)
export async function generateCommunityFlag(values: z.infer<typeof flagActionSchema>) {
    
    try {
        const adminApp = initializeAdminApp();
        
        const validatedFields = flagActionSchema.safeParse(values);
        if (!validatedFields.success) {
            const errorMessage = validatedFields.error.issues[0]?.message || 'Invalid input.';
            return { error: errorMessage };
        }
        
        const { communityId, communityName, communityDescription, idToken } = validatedFields.data;

        const decodedIdToken = await adminApp.auth().verifyIdToken(idToken);
        const uid = decodedIdToken.uid;

        const communityDoc = await adminApp.firestore().collection('communities').doc(communityId).get();
        if (!communityDoc.exists || communityDoc.data()?.ownerId !== uid) {
            return { error: "Unauthorized: You are not the owner of this community." };
        }

        // Call the dedicated Genkit flow
        const output = await generateFlagFlow({ communityName, communityDescription });
        
        if (!output || !output.svg) {
            throw new Error('Failed to generate a flag SVG from the AI flow.');
        }

        const svgBase64 = Buffer.from(output.svg, 'utf-8').toString('base64');
        const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

        return {
            data: {
                flagUrl: svgDataUri,
            }
        };

    } catch (e) {
        console.error('Flag Generation Action Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        if (message.includes('ID token has expired') || message.includes('verifyIdToken')) {
            return { error: "Your session has expired. Please log in again."}
        }
        return { error: `Flag generation failed: ${message}` };
    }
}
