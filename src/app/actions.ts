'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';
import { generateCommunity } from '@/ai/flows/generate-community';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';


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
      sourceLanguage: sourceLanguage
    };
  } catch (e) {
    console.error('Action Error:', e);
    const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: `Story generation failed. ${message}` };
  }
}

const communitySchema = z.object({
    prompt: z.string().min(10),
});

export async function createCommunity(values: z.infer<typeof communitySchema>) {
    try {
        const { auth, firestore } = initializeFirebase();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return { error: 'You must be logged in to create a community.' };
        }

        const validatedFields = communitySchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid prompt.' };
        }

        const { prompt } = validatedFields.data;

        // Generate community details using the AI flow
        const communityDetails = await generateCommunity({ prompt });

        if (!communityDetails.name || !communityDetails.description || !communityDetails.welcomeMessage) {
            throw new Error('AI failed to generate complete community details.');
        }
        
        // Create a new document reference in the user's communities subcollection
        const newCommunityRef = doc(collection(firestore, 'users', currentUser.uid, 'communities'));

        const newCommunity = {
            id: newCommunityRef.id,
            ownerId: currentUser.uid,
            name: communityDetails.name,
            description: communityDetails.description,
            welcomeMessage: communityDetails.welcomeMessage,
        };

        // Save the new community to Firestore
        await setDoc(newCommunityRef, newCommunity);

        return { success: true, communityId: newCommunityRef.id };

    } catch (e) {
        console.error('Community Creation Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Community creation failed. ${message}` };
    }
}
