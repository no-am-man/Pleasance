
'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';
import { generateCommunity } from '@/ai/flows/generate-community';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { chatWithMember, ChatWithMemberInput } from '@/ai/flows/chat-with-member';
import { generateSpeech } from '@/ai/flows/generate-speech';
import { VOICES } from '@/config/languages';

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

    if (!translationResult.translatedText) {
      throw new Error('Failed to translate the story.');
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
