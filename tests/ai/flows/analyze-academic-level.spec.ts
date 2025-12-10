// tests/ai/flows/analyze-academic-level.spec.ts
import { test, expect, describe } from 'vitest';
import { analyzeAcademicLevel } from '@/ai/flows/analyze-academic-level';
import { z } from 'zod';

const AnalyzeLevelOutputSchema = z.object({
  academicLevel: z.string().min(1),
});

describe('analyzeAcademicLevel flow', () => {

  test('should analyze undergraduate-level philosophy studies', async () => {
    const input = {
      studies: "I've spent the last year reading all of Plato's dialogues and Aristotle's major works like the Nicomachean Ethics. I've also written several long-form essays comparing their philosophical systems.",
    };

    const result = await analyzeAcademicLevel(input);
    const validation = AnalyzeLevelOutputSchema.safeParse(result);
    expect(validation.success, 'Output should match Zod schema').toBe(true);
    
    if (validation.success) {
      console.log(`Input: "${input.studies}" -> Output: "${result.academicLevel}"`);
      expect(result.academicLevel.toLowerCase()).toContain('philosophy');
    }
  }, 45000);

  test('should analyze advanced self-taught technical skills', async () => {
    const input = {
      studies: "For the past three years, I have been deeply involved in machine learning. I've completed over 300 hours of specialized online courses from Stanford and deeplearning.ai, built multiple projects including a GAN for image generation and a transformer-based text summarizer, and I regularly read and implement concepts from the latest papers on arXiv.",
    };

    const result = await analyzeAcademicLevel(input);
    const validation = AnalyzeLevelOutputSchema.safeParse(result);
    expect(validation.success, 'Output should match Zod schema').toBe(true);

    if (validation.success) {
        console.log(`Input: "${input.studies}" -> Output: "${result.academicLevel}"`);
        expect(result.academicLevel.toLowerCase()).toContain('computer science');
        expect(result.academicLevel.toLowerCase()).toContain("bachelor's equivalent");
    }
  }, 45000);

  test('should analyze doctoral-level specialized research', async () => {
    const input = {
      studies: "My entire intellectual focus for the last decade has been on the intersection of post-structuralist thought and quantum mechanics. I am particularly focused on the works of Jacques Derrida and Karen Barad, and I am currently finalizing a book-length manuscript that proposes a new model of 'agential realism' based on their theories. I have also presented my initial findings at two niche academic conferences.",
    };

    const result = await analyzeAcademicLevel(input);
    const validation = AnalyzeLevelOutputSchema.safeParse(result);
    expect(validation.success, 'Output should match Zod schema').toBe(true);

    if (validation.success) {
        console.log(`Input: "${input.studies}" -> Output: "${result.academicLevel}"`);
        expect(result.academicLevel.toLowerCase()).toContain('doctoral');
        expect(result.academicLevel.toLowerCase()).toContain('philosophy');
    }
  }, 45000);

});
