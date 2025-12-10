// tests/ai/flows/generate-story.spec.ts
import { test, expect, describe } from 'vitest';
import { generateStory } from '@/ai/flows/generate-story';
import { z } from 'zod';

const GenerateStoryOutputSchema = z.object({
  story: z.string(),
});

describe('generateStory flow', () => {

  test('should generate a beginner level story in English', async () => {
    const input = {
      difficultyLevel: 'beginner' as const,
      sourceLanguage: 'English',
      prompt: 'A cat who is afraid of mice',
    };

    const result = await generateStory(input);
    
    // Validate the output against the Zod schema
    const validation = GenerateStoryOutputSchema.safeParse(result);
    expect(validation.success).toBe(true);

    if (validation.success) {
        expect(validation.data.story).toBeDefined();
        expect(typeof validation.data.story).toBe('string');
        expect(validation.data.story.length).toBeGreaterThan(50); // Expect a reasonably long story
        console.log('Beginner story generated successfully.');
    }
  }, 30000);

  test('should generate an advanced level story in French', async () => {
    const input = {
      difficultyLevel: 'advanced' as const,
      sourceLanguage: 'French',
      prompt: 'Un voyageur temporel qui perd sa machine',
    };

    const result = await generateStory(input);

    const validation = GenerateStoryOutputSchema.safeParse(result);
    expect(validation.success).toBe(true);

    if (validation.success) {
        expect(validation.data.story).toBeDefined();
        expect(typeof validation.data.story).toBe('string');
        expect(validation.data.story.length).toBeGreaterThan(50);
        console.log('Advanced French story generated successfully.');
    }
  }, 30000);
});
