
'use server';
/**
 * @fileOverview A flow to refine a wiki page's content and generate a relevant image.
 *
 * - refineWikiPage - A function that takes a title and content and generates an improved version.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';


const RefineWikiInputSchema = z.object({
  title: z.string().describe('The title of the wiki page.'),
  content: z.string().describe('The existing markdown content of the page to be refined.'),
});
type RefineWikiInput = z.infer<typeof RefineWikiInputSchema>;

const RefineWikiOutputSchema = z.object({
  refinedContent: z.string().describe('The AI-generated, refined markdown content for the wiki page.'),
  image: z.string().optional().describe('The generated image as a Base64-encoded data URI.'),
});
export type RefineWikiOutput = z.infer<typeof RefineWikiOutputSchema>;

const ImagePromptSchema = z.object({
    prompt: z.string().describe('A concise, descriptive prompt for a text-to-image model, based on the most important concept in the text. The style should be abstract and artistic.')
});


export async function refineWikiPage(input: RefineWikiInput): Promise<RefineWikiOutput> {
  return refineWikiPageFlow(input);
}


const refineWikiPrompt = ai.definePrompt({
    name: 'refineWikiPagePrompt',
    input: { schema: RefineWikiInputSchema },
    output: { schema: z.object({ refinedContent: z.string() }) },
    prompt: `You are an expert technical writer and collaborative editor specializing in markdown formatting. Your task is to take a wiki page's title and its current markdown content and refine it.

- Improve clarity, structure, and flow.
- Add more detail where appropriate, based on the title and context.
- Correct any grammatical errors or awkward phrasing.
- Ensure the output is well-formatted markdown, paying close attention to headings, lists, code blocks, and blockquotes.
- The tone should be informative, clear, and collaborative.

Page Title: "{{title}}"

Existing Content:
"""
{{content}}
"""

Generate the refined markdown content for the page.
`,
    config: {
        model: "googleai/gemini-pro",
    },
});

const generateImagePrompt = ai.definePrompt({
    name: 'generateWikiImagePrompt',
    input: { schema: RefineWikiInputSchema },
    output: { schema: ImagePromptSchema },
    prompt: `Analyze the following wiki page content and title. Identify the single most important, core concept. Create a concise, visually descriptive prompt for a text-to-image model to generate an abstract, artistic image that represents this core concept.

Page Title: "{{title}}"
Content: "{{content}}"

The image prompt should be creative and evocative.
`,
    config: {
        model: 'googleai/gemini-pro',
    }
});


const refineWikiPageFlow = ai.defineFlow(
  {
    name: 'refineWikiPageFlow',
    inputSchema: RefineWikiInputSchema,
    outputSchema: RefineWikiOutputSchema,
  },
  async (input) => {
    // Run text and image prompt generation in parallel
    const [
      { output: textOutput },
      { output: imagePromptOutput }
    ] = await Promise.all([
      refineWikiPrompt(input),
      generateImagePrompt(input)
    ]);
    
    if (!textOutput) {
        throw new Error("The AI failed to generate refined content for the wiki page.");
    }
    
    let generatedImage: string | undefined = undefined;

    if (imagePromptOutput?.prompt) {
        try {
            const { media } = await ai.generate({
                model: 'googleai/imagen-4.0-fast-generate-001',
                prompt: imagePromptOutput.prompt,
                config: { aspectRatio: "16:9" },
            });
            generatedImage = media.url;
        } catch (e) {
            console.error("Image generation failed, proceeding without image.", e);
        }
    }

    return {
        refinedContent: textOutput.refinedContent,
        image: generatedImage,
    };
  }
);
