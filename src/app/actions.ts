'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';

const storySchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
});

export async function generateAndTranslateStory(values: z.infer<typeof storySchema>) {
  try {
    const validatedFields = storySchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: 'Invalid input.' };
    }
    
    const { difficulty, sourceLanguage, targetLanguage } = validatedFields.data;

    const storyResult = await generateStory({ difficultyLevel: difficulty, sourceLanguage });
    if (!storyResult.story) {
      throw new Error('Failed to generate a story.');
    }
    const originalStory = storyResult.story;

    // If source and target languages are the same, no need to translate.
    if (sourceLanguage === targetLanguage) {
      const translationResult = await translateStory({
        storyText: originalStory,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
      });

       if (!translationResult.translatedText || !translationResult.audioDataUri) {
         throw new Error('Failed to generate audio for the story.');
       }

      return {
        originalStory,
        translatedText: translationResult.translatedText,
        audioDataUri: translationResult.audioDataUri,
        sourceLanguage: sourceLanguage
      };
    }

    const translationResult = await translateStory({
      storyText: originalStory,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
    });

    if (!translationResult.translatedText || !translationResult.audioDataUri) {
      throw new Error('Failed to translate the story or generate audio.');
    }

    return {
      originalStory,
      translatedText: translationResult.translatedText,
      audioDataUri: translationResult.audioDataUri,
      sourceLanguage: sourceLanguage
    };
  } catch (e) {
    console.error('Action Error:', e);
    const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: `Story generation failed. ${message}` };
  }
}
