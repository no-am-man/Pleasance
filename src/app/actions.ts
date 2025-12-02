
'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';
import { generateCommunity } from '@/ai/flows/generate-community';
import { chatWithMember, ChatWithMemberInput } from '@/ai/flows/chat-with-member';
import { generateSpeech } from '@/ai/flows/generate-speech';
import { generateAvatars } from '@/ai/flows/generate-avatars';
import { syncAllMembers } from '@/ai/flows/sync-members';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';


const storySchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
  userId: z.string(),
});

export async function generateStoryAndSpeech(values: z.infer<typeof storySchema>) {
  try {
    const validatedFields = storySchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: 'Invalid input.' };
    }
    
    const { difficulty, sourceLanguage, targetLanguage, userId } = validatedFields.data;

    // --- Step 1: Generate and Translate Story ---
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

    if (!translationResult || !translationResult.translatedText) {
      throw new Error('Failed to translate the story.');
    }
    const translatedText = translationResult.translatedText;

    // --- Step 2: Initialize Firebase Admin ---
    const adminApp = initializeAdminApp();
    const firestore = adminApp.firestore();
    const storage = getStorage(adminApp);

    // --- Step 3: Save Initial Story to Firestore ---
    const storyCollectionRef = collection(firestore, 'users', userId, 'stories');
    const newStoryData = {
        userId: userId,
        level: difficulty,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        nativeText: originalStory,
        translatedText: translatedText,
        createdAt: serverTimestamp(),
        audioUrl: '', // Initialize with empty audioUrl
    };
    const newDocRef = await addDoc(storyCollectionRef, newStoryData);
    const storyId = newDocRef.id;

    // --- Step 4: Generate Speech ---
    const speechResult = await generateSpeech({ text: translatedText });
    if (!speechResult.wavBuffer) {
        throw new Error('Speech synthesis failed to produce audio.');
    }

    // --- Step 5: Upload Audio and Get URL ---
    const storagePath = `stories/${userId}/${storyId}.wav`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, speechResult.wavBuffer, { contentType: 'audio/wav' });
    const downloadURL = await getDownloadURL(storageRef);

    // --- Step 6: Update Story with Audio URL ---
    const storyDocRef = doc(firestore, 'users', userId, 'stories', storyId);
    await updateDoc(storyDocRef, { audioUrl: downloadURL });

    // --- Step 7: Return Complete Story Object ---
    return {
      story: {
        id: storyId,
        userId,
        level: difficulty,
        sourceLanguage,
        targetLanguage,
        nativeText: originalStory,
        translatedText,
        audioUrl: downloadURL,
        createdAt: null, // This can be null for the client, it's set on the server
      }
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

const generateAvatarsSchema = z.object({
    name: z.string().min(1, 'Name is required to generate an avatar.'),
});

export async function generateProfileAvatars(values: z.infer<typeof generateAvatarsSchema>) {
    try {
        const validatedFields = generateAvatarsSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for avatar generation.' };
        }

        const { name } = validatedFields.data;
        const result = await generateAvatars({ name });

        if (!result.avatars || result.avatars.length === 0) {
            return { error: 'Could not generate avatars.' };
        }

        return { avatars: result.avatars };
    } catch (e) {
        console.error('Avatar Generation Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Avatar generation failed. ${message}` };
    }
}

export async function runMemberSync() {
    try {
        // Initialize admin app to ensure server-side operations are authenticated
        initializeAdminApp(); 
        const result = await syncAllMembers();
        return { data: result };
    } catch(e) {
        const message = e instanceof Error ? e.message : 'An unexpected error occurred during member sync.';
        return { error: message };
    }
}
