
'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';
import { generateCommunity } from '@/ai/flows/generate-community';
import { chatWithMember, ChatWithMemberInput } from '@/ai/flows/chat-with-member';
import { generateSpeech } from '@/ai/flows/generate-speech';
import { generateAvatars } from '@/ai/flows/generate-avatars';
import { syncAllMembers } from '@/ai/flows/sync-members';
import { generateFlag } from '@/ai/flows/generate-flag';
import { VOICES } from '@/config/languages';
import { initializeFirebase } from '@/firebase/config-for-actions';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

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

    if (!translationResult || !translationResult.translatedText) {
      throw new Error('Failed to translate the story. The AI may have returned an empty response.');
    }

    return {
      originalStory,
      translatedText: translationResult.translatedText,
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

const speechSchema = z.object({
    text: z.string(),
    voice: z.enum(VOICES.map(v => v.value) as [string, ...string[]]),
});

export async function synthesizeSpeech(values: z.infer<typeof speechSchema>) {
    try {
        const validatedFields = speechSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for speech synthesis.' };
        }
        
        const { text, voice } = validatedFields.data;
        const speechResult = await generateSpeech({ text, voiceName: voice });
        
        if (!speechResult.wavBase64) {
            return { error: 'Speech synthesis failed.' };
        }

        return { audioDataUri: `data:audio/wav;base64,${speechResult.wavBase64}` };

    } catch (e) {
        console.error('Speech Synthesis Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Speech synthesis failed. ${message}` };
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
        const result = await syncAllMembers();
        return { data: result };
    } catch(e) {
        const message = e instanceof Error ? e.message : 'An unexpected error occurred during member sync.';
        return { error: message };
    }
}

const flagSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
});

export async function generateCommunityFlag(values: z.infer<typeof flagSchema>) {
    try {
        const validatedFields = flagSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for flag generation.' };
        }
        
        const { communityId, communityName, communityDescription } = validatedFields.data;

        // 1. Generate the flag image data URI from the AI flow
        const flagResult = await generateFlag({ communityName, communityDescription });
        if (!flagResult.flagUrl) {
            throw new Error('Failed to generate a flag image from the AI flow.');
        }

        // 2. Upload the flag from the server action
        const { storage } = initializeFirebase();
        const storagePath = `communities/${communityId}/flag.png`;
        const storageRef = ref(storage, storagePath);
        const base64Data = flagResult.flagUrl.split(',')[1];
      
        if (!base64Data) {
            throw new Error('Invalid data URI format received from AI.');
        }

        await uploadString(storageRef, base64Data, 'base64', { contentType: 'image/png' });
        const downloadURL = await getDownloadURL(storageRef);
        
        // 3. Return the public URL to the client
        return { flagUrl: downloadURL };

    } catch (e) {
        console.error('Flag Generation Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Flag generation failed. ${message}` };
    }
}
