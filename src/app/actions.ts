
'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';
import { generateCommunity } from '@/ai/flows/generate-community';
import { chatWithMember, ChatWithMemberInput } from '@/ai/flows/chat-with-member';
import { generateSpeech } from '@/ai/flows/generate-speech';
import { generateAvatars } from '@/ai/flows/generate-avatars';
import { syncAllMembers } from '@/ai/flows/sync-members';
import { VOICES } from '@/config/languages';
import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase/auth';
import { initializeFirebase as initializeClientFirebase } from '@/firebase/config-for-actions';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';


const storySchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
});

async function getFounderVerifiedAdminApp() {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
        throw new Error('Unauthorized: No session cookie found. Please log in again.');
    }
    
    // Temporarily initialize to get credentials, if no apps exist.
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    
    const tempFirestore = admin.firestore();
    const credentialsDoc = await tempFirestore.collection('_private_admin_data').doc('credentials').get();

    if (!credentialsDoc.exists) {
        throw new Error("Service account key not found in Firestore. Please set it on the Admin Panel.");
    }

    const serviceAccountKeyBase64 = credentialsDoc.data()?.serviceAccountKeyBase64;
    if (!serviceAccountKeyBase64) {
        throw new Error("Service account key is empty in Firestore. Please check the Admin Panel.");
    }

    let serviceAccount;
    try {
        const decodedKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decodedKey);
    } catch (e) {
        throw new Error("Failed to parse the service account key from Firestore. It may be malformed.");
    }
    
    const appName = 'pleasance-admin-actions';
    const existingApp = admin.apps.find(app => app?.name === appName);
    if (existingApp) {
        // Quick check to see if the user is still the founder
        const auth = admin.auth(existingApp);
        const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
        if (decodedIdToken.email !== 'gg.el0ai.com@gmail.com') {
            throw new Error('Unauthorized: You are not the founder.');
        }
        return existingApp;
    }

    const newApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    }, appName);
    
    const auth = admin.auth(newApp);
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    if (decodedIdToken.email !== 'gg.el0ai.com@gmail.com') {
        // Clean up the newly created app if the user is not the founder
        await newApp.delete();
        throw new Error('Unauthorized: You are not the founder.');
    }

    return newApp;
}


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

const credentialsSchema = z.object({
  serviceAccountKey: z.string().min(1, 'Service account key cannot be empty.'),
});

export async function saveCredentials(values: z.infer<typeof credentialsSchema>) {
    try {
        const validatedFields = credentialsSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input.' };
        }
        
        const sessionCookie = cookies().get('__session')?.value;
        if (!sessionCookie) {
            return { error: 'Unauthorized: No session cookie found.' };
        }

        if (admin.apps.length === 0) {
             admin.initializeApp();
        }
        
        const decodedIdToken = await admin.auth().verifySessionCookie(sessionCookie, true);

        if (decodedIdToken.email !== 'gg.el0ai.com@gmail.com') {
            return { error: 'Unauthorized: Only the founder can save credentials.' };
        }
        
        const firestore = admin.firestore();
        const docRef = firestore.collection('_private_admin_data').doc('credentials');
        await docRef.set({ serviceAccountKeyBase64: values.serviceAccountKey });

        return { success: true };

    } catch (e) {
        console.error('Save Credentials Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to save credentials: ${message}` };
    }
}


export async function getCredentials() {
    try {
        const adminApp = await getFounderVerifiedAdminApp();
        const firestore = admin.firestore(adminApp);
        
        const docRef = firestore.collection('_private_admin_data').doc('credentials');
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            return { data: docSnap.data() };
        } else {
            return { data: null };
        }
    } catch (e) {
        console.error('Get Credentials Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to get credentials: ${message}` };
    }
}
