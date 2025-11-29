'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';

const storySchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  targetLanguage: z.string().min(1),
});

export async function generateAndTranslateStory(values: z.infer<typeof storySchema>) {
  try {
    const validatedFields = storySchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: 'Invalid input.' };
    }
    
    const { difficulty, targetLanguage } = validatedFields.data;

    const storyResult = await generateStory({ difficultyLevel: difficulty });
    if (!storyResult.story) {
      throw new Error('Failed to generate a story.');
    }
    const originalStory = storyResult.story;

    const translationResult = await translateStory({
      storyText: originalStory,
      sourceLanguage: 'English',
      targetLanguage: targetLanguage,
    });

    if (!translationResult.translatedText || !translationResult.audioDataUri) {
      throw new Error('Failed to translate the story or generate audio.');
    }

    return {
      originalStory,
      translatedText: translationResult.translatedText,
      audioDataUri: translationResult.audioDataUri,
    };
  } catch (e) {
    console.error('Action Error:', e);
    const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: `Story generation failed. ${message}` };
  }
}
