
'use server';
/**
 * @fileOverview A Genkit tool to analyze a user's academic experience, update their profile,
 * and increase the worth of a specified community.
 *
 * - analyzeStudiesAndBoostCommunityTool - The tool function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { analyzeAcademicLevel } from '../flows/analyze-academic-level';
import { GEMINI_PRO } from '@/config/models';

const AnalyzeStudiesInputSchema = z.object({
  userId: z.string().describe("The ID of the user whose studies are being analyzed."),
  communityId: z.string().describe("The ID of the community whose worth should be increased."),
  studies: z.string().describe("A user's description of their autodidactic or formal studies."),
});

const AnalyzeStudiesOutputSchema = z.object({
  academicLevel: z.string().describe("The determined academic level."),
  communityWorthIncrease: z.number().describe("The amount of value added to the community."),
  message: z.string().describe("A confirmation message for the user."),
});

// A mapping from keywords in academic levels to a numeric value
const levelToValue: Record<string, number> = {
    'undergraduate': 1000,
    'bachelor': 2500,
    'graduate': 5000,
    'master': 7500,
    'doctoral candidate': 10000,
    'phd': 15000,
    'postdoctoral': 20000,
};

function getValueFromLevel(level: string): number {
    const lowerCaseLevel = level.toLowerCase();
    for (const key in levelToValue) {
        if (lowerCaseLevel.includes(key)) {
            return levelToValue[key];
        }
    }
    return 500; // Default value for unrecognized levels
}


export const analyzeStudiesAndBoostCommunityTool = ai.defineTool(
  {
    name: 'analyzeStudiesAndBoostCommunity',
    description: "Analyzes a user's description of their studies to determine an academic level, updates the user's profile with this level, and adds a corresponding value to a specified community's worth. Use this when a user wants to contribute their intellectual capital to a community.",
    inputSchema: AnalyzeStudiesInputSchema,
    outputSchema: AnalyzeStudiesOutputSchema,
  },
  async (input) => {
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);
    
    // Step 1: Call the existing flow to analyze the academic level
    const { academicLevel } = await analyzeAcademicLevel({ studies: input.studies });

    // Step 2: Determine the value to add
    const valueToAdd = getValueFromLevel(academicLevel);

    // Step 3: Update the user's profile and the community's worth in a transaction
    const userProfileRef = firestore.collection('community-profiles').doc(input.userId);
    const communityRef = firestore.collection('communities').doc(input.communityId);

    await firestore.runTransaction(async (transaction) => {
        const communityDoc = await transaction.get(communityRef);
        if (!communityDoc.exists) {
            throw new Error(`Community with ID "${input.communityId}" not found.`);
        }

        // Update user profile
        transaction.update(userProfileRef, { academicLevel });

        // Increment community worth
        transaction.update(communityRef, { worth: FieldValue.increment(valueToAdd) });
    });

    return {
      academicLevel,
      communityWorthIncrease: valueToAdd,
      message: `Successfully analyzed academic level as "${academicLevel}". Added ${valueToAdd} to the community's worth and updated your profile.`,
    };
  }
);
