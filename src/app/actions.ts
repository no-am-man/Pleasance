'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';
import { generateCommunity } from '@/ai/flows/generate-community';
import { generateImage } from '@/ai/flows/generate-image';

const storySchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
  stylePrompt: z.string().optional(),
});

export async function generateAndTranslateStory(values: z.infer<typeof storySchema>) {
  try {
    const validatedFields = storySchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: 'Invalid input.' };
    }
    
    const { difficulty, sourceLanguage, targetLanguage, stylePrompt } = validatedFields.data;

    // Generate Story
    const storyResult = await generateStory({ difficultyLevel: difficulty, sourceLanguage });
    if (!storyResult.story) {
      throw new Error('Failed to generate a story.');
    }
    const originalStory = storyResult.story;
    
    // Generate Image
    const imagePrompt = `Create a book cover for a ${difficulty} level story. The story is about: ${originalStory.substring(0, 200)}. The style should be ${stylePrompt || 'a vibrant digital painting'}.`;
    const imageResult = await generateImage({ prompt: imagePrompt });
    if (!imageResult.imageUrl) {
        throw new Error('Failed to generate an image.');
    }

    // Translate Story
    const translationResult = await translateStory({
      storyText: originalStory,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
    });

    if (!translationResult.translatedText) {
      throw new Error('Failed to translate the story.');
    }

    return {
      originalStory,
      translatedText: translationResult.translatedText,
      audioDataUri: translationResult.audioDataUri,
      imageUrl: imageResult.imageUrl,
      sourceLanguage: sourceLanguage,
    };
  } catch (e) {
    console.error('Action Error:', e);
    const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: `Story creation failed. ${message}` };
  }
}

const communitySchema = z.object({
    prompt: z.string().min(10),
});

export async function createCommunityDetails(values: z.infer<typeof communitySchema>) {
    try {
        const validatedFields = communitySchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid prompt.' };
        }

        const { prompt } = validatedFields.data;

        // Generate community details using the AI flow
        const communityDetails = await generateCommunity({ prompt });

        if (!communityDetails.name || !communityDetails.description || !communityDetails.welcomeMessage || !communityDetails.members) {
            throw new Error('AI failed to generate complete community details.');
        }

        return {
            name: communityDetails.name,
            description: communityDetails.description,
            welcomeMessage: communityDetails.welcomeMessage,
            members: communityDetails.members,
        };

    } catch (e) {
        console.error('Community Creation Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Community creation failed. ${message}` };
    }
}
