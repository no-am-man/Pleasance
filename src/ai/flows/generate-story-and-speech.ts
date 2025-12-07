
// src/ai/flows/generate-story-and-speech.ts
'use server';
/**
 * @fileOverview Orchestrates the generation of a story, its translation, and speech synthesis.
 *
 * - generateStoryAndSpeech - The main server action for this process.
 */

import { generateDualStory } from './generate-dual-story';
import { generateSpeech } from './generate-speech';
import { firestore } from '@/firebase/config';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocument } from '@/firebase/non-blocking-updates';
import { z } from 'zod';
import type { Story } from '@/lib/types';
import { DualLanguageStorySchema } from '@/lib/types';

const InputSchema = z.object({
  userId: z.string(),
  prompt: z.string(),
  targetLanguage: z.string(),
  sourceLanguage: z.string(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
});

type InputType = z.infer<typeof InputSchema>;

export async function generateStoryAndSpeech(values: InputType) {
    try {
        const validatedFields = InputSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input.' };
        }
        
        const { userId, prompt, targetLanguage, sourceLanguage, difficultyLevel } = validatedFields.data;

        // Step 1: Generate the story in dual language format
        const storyResult = await generateDualStory({ prompt, targetLanguage, sourceLanguage, difficultyLevel });
        if ('error' in storyResult || !storyResult) {
            throw new Error(storyResult?.error || 'Failed to generate the initial story text.');
        }

        // Step 2: Generate speech from the translated text
        const speechResult = await generateSpeech({
            text: storyResult.contentOriginal, // Use the original content for speech
        });
        if (!speechResult.audioUrl) {
            throw new Error('Failed to generate speech audio.');
        }
        
        // Step 3: Prepare the story data for Firestore
        const storyData: Omit<Story, 'id'> = {
            userId,
            level: difficultyLevel,
            sourceLanguage,
            targetLanguage,
            nativeText: storyResult.contentTranslated,
            translatedText: storyResult.contentOriginal,
            audioUrl: speechResult.audioUrl,
            createdAt: serverTimestamp(),
            status: 'complete' as const,
            titleOriginal: storyResult.titleOriginal,
            titleTranslated: storyResult.titleTranslated,
            contentOriginal: storyResult.contentOriginal,
            contentTranslated: storyResult.contentTranslated,
            vocabulary: storyResult.vocabulary,
        };

        // Step 4: Save the story to Firestore (non-blocking)
        const storiesColRef = collection(firestore, `users/${userId}/stories`);
        const newDocRef = await addDocument(storiesColRef, storyData);
        
        const finalStoryData: Story = {
          ...storyData,
          id: newDocRef.id,
          createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
        };

        return { storyData: finalStoryData };

    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred during story generation.';
        console.error('generateStoryAndSpeech Error:', message);
        return { error: message };
    }
}
