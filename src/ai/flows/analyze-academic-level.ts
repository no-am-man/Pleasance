
'use server';
/**
 * @fileOverview A flow to analyze a user's self-described academic experience
 * and determine an equivalent academic level.
 *
 * - analyzeAcademicLevel - A function that takes a description of studies and returns a level.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GEMINI_PRO } from '@/config/models';

const AnalyzeLevelInputSchema = z.object({
  studies: z.string().describe("A user's description of their autodidactic or formal studies."),
});
type AnalyzeLevelInput = z.infer<typeof AnalyzeLevelInputSchema>;

const AnalyzeLevelOutputSchema = z.object({
  academicLevel: z.string().describe("A concise academic level equivalent, e.g., 'Doctoral Candidate in Philosophy', 'Bachelor's Equivalent in Computer Science'."),
});
export type AnalyzeLevelOutput = z.infer<typeof AnalyzeLevelOutputSchema>;

export async function analyzeAcademicLevel(input: AnalyzeLevelInput): Promise<AnalyzeLevelOutput> {
  return analyzeAcademicLevelFlow(input);
}

const analyzeLevelPrompt = ai.definePrompt({
    name: 'analyzeAcademicLevelPrompt',
    input: { schema: AnalyzeLevelInputSchema },
    output: { schema: AnalyzeLevelOutputSchema },
    config: {
        model: GEMINI_PRO,
    },
    prompt: `You are an expert academic advisor. Your task is to analyze the user's description of their studies and determine a concise, equivalent academic level.
    Focus on the depth and breadth of the subjects mentioned. Be realistic but encouraging.

    Examples:
    - "I've read all of Plato and Aristotle and written several essays on their ethics." -> "Undergraduate Level in Classical Philosophy"
    - "I've completed 300+ hours of online courses in machine learning, built several projects, and read key papers." -> "Bachelor's Equivalent in Computer Science"
    - "For the last five years, I have been exclusively studying the works of Hegel, Heidegger, and their relation to quantum mechanics, and am currently writing a book-length manuscript on the topic." -> "Doctoral Candidate in Continental Philosophy"

    User's description of studies:
    "{{{studies}}}"

    Generate a concise academic level.`,
});

const analyzeAcademicLevelFlow = ai.defineFlow(
  {
    name: 'analyzeAcademicLevelFlow',
    inputSchema: AnalyzeLevelInputSchema,
    outputSchema: AnalyzeLevelOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeLevelPrompt(input);
    if (!output) {
        throw new Error("The AI failed to analyze the academic level.");
    }
    return output;
  }
);
