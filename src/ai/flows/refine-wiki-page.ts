
'use server';
/**
 * @fileOverview A flow to refine a wiki page's content using AI.
 *
 * - refineWikiPage - A function that takes a title and content and generates an improved version.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RefineWikiInputSchema = z.object({
  title: z.string().describe('The title of the wiki page.'),
  content: z.string().describe('The existing markdown content of the page to be refined.'),
});
type RefineWikiInput = z.infer<typeof RefineWikiInputSchema>;

const RefineWikiOutputSchema = z.object({
  refinedContent: z.string().describe('The AI-generated, refined markdown content for the wiki page.'),
});
export type RefineWikiOutput = z.infer<typeof RefineWikiOutputSchema>;


export async function refineWikiPage(input: RefineWikiInput): Promise<RefineWikiOutput> {
  return refineWikiPageFlow(input);
}


const refineWikiPrompt = ai.definePrompt({
    name: 'refineWikiPagePrompt',
    input: { schema: RefineWikiInputSchema },
    output: { schema: RefineWikiOutputSchema },
    prompt: `You are an expert technical writer and collaborative editor. Your task is to take a wiki page's title and its current markdown content and refine it.

- Improve clarity, structure, and flow.
- Add more detail where appropriate, based on the title and context.
- Correct any grammatical errors or awkward phrasing.
- Ensure the output is well-formatted markdown.
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


const refineWikiPageFlow = ai.defineFlow(
  {
    name: 'refineWikiPageFlow',
    inputSchema: RefineWikiInputSchema,
    outputSchema: RefineWikiOutputSchema,
  },
  async (input) => {
    const { output } = await refineWikiPrompt(input);
    if (!output) {
        throw new Error("The AI failed to generate refined content for the wiki page.");
    }
    return output;
  }
);
