
'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';
import { generateCommunity } from '@/ai/flows/generate-community';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { chatWithMember, ChatWithMemberInput } from '@/ai/flows/chat-with-member';
import { getFirestore, doc, setDoc, serverTimestamp, collection } from 'firebase/firestore/lite';
import { initializeFirebase } from '@/firebase/config-for-actions';

const storySchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
  userId: z.string().min(1),
});

export async function generateAndTranslateStory(values: z.infer<typeof storySchema>) {
  try {
    const validatedFields = storySchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: 'Invalid input.' };
    }
    
    const { difficulty, sourceLanguage, targetLanguage, userId } = validatedFields.data;

    // Generate Story
    const storyResult = await generateStory({ difficultyLevel: difficulty, sourceLanguage });
    if (!storyResult.story) {
      throw new Error('Failed to generate a story.');
    }
    const originalStory = storyResult.story;
    
    // Translate Story
    const translationResult = await translateStory({
      storyText: originalStory,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
    });

    if (!translationResult.translatedText) {
      throw new Error('Failed to translate the story.');
    }
    
    // Save to Firestore in user's subcollection
    const { firestore } = initializeFirebase();
    const storyCollectionRef = collection(firestore, 'users', userId, 'stories');
    const storyRef = doc(storyCollectionRef);

    const newStory = {
        id: storyRef.id,
        userId: userId,
        level: difficulty,
        sourceLanguage,
        targetLanguage,
        nativeText: originalStory,
        translatedText: translationResult.translatedText,
        audioDataUri: translationResult.audioDataUri,
        createdAt: serverTimestamp()
    };
    
    await setDoc(storyRef, newStory);

    return {
      originalStory,
      translatedText: translationResult.translatedText,
      audioDataUri: translationResult.audioDataUri,
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

const voiceMessageSchema = z.object({
  audioDataUri: z.string(),
});

export async function getTranscription(values: z.infer<typeof voiceMessageSchema>) {
    try {
        const validatedFields = voiceMessageSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid audio data.' };
        }

        const { audioDataUri } = validatedFields.data;
        const result = await transcribeAudio({ audioDataUri });

        return { transcription: result.transcription };

    } catch(e) {
        console.error('Transcription Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Transcription failed. ${message}` };
    }
}


export async function getAiChatResponse(input: ChatWithMemberInput) {
    try {
        const result = await chatWithMember(input);
        if (!result.response) {
            return { error: 'The AI member could not think of a response.' };
        }
        return { response: result.response };
    } catch (e) {
        console.error('AI Chat Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `AI chat failed. ${message}` };
    }
}

    