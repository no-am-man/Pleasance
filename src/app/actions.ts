
'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';
import { chatWithMember } from '@/ai/flows/chat-with-member';
import type { ChatHistory, Part } from 'genkit';
import { generateSpeech } from '@/ai/flows/generate-speech';
import { generateAvatars } from '@/ai/flows/generate-avatars';
import { syncAllMembers } from '@/ai/flows/sync-members';
import { initializeAdminApp } from '@/firebase/config-admin';
import { firebaseConfig } from '@/firebase/config';
import admin from 'firebase-admin';
import { generateCommunity } from '@/ai/flows/generate-community';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import wav from 'wav';
import { generateSvg3d } from '@/ai/flows/generate-svg3d-flow';


// Schema for chat input, as it's used across client and server
const MemberSchema = z.object({
  name: z.string().describe("The AI member's unique name."),
  role: z.string().describe("The member's role in the community."),
  bio: z.string().describe("A short bio describing the member's personality and purpose."),
  type: z.enum(['AI', 'human']).describe('The type of member.'),
});

export type ChatWithMemberInput = {
    member: z.infer<typeof MemberSchema>;
    userMessage: string;
    history?: ChatHistory;
}

const storyTextSchema = z.object({
  userId: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
});

/**
 * Encodes raw PCM audio data into a WAV format buffer, then returns it as a Base64 string.
 * @param pcmData The raw PCM audio data buffer.
 * @returns A Promise that resolves to a Base64 encoded string of the WAV file.
 */
async function toWav(pcmData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,       // Mono audio
      sampleRate: 24000,   // Sample rate returned by the TTS model
      bitDepth: 16,      // 16-bit audio
    });

    const buffers: any[] = [];
    writer.on('data', (chunk) => buffers.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));
    writer.on('error', reject);

    writer.write(pcmData);
    writer.end();
  });
}


export async function generateStoryAndSpeech(values: z.infer<typeof storyTextSchema>) {
  try {
    const validatedFields = storyTextSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: 'Invalid input.' };
    }
    
    const { userId, difficulty, sourceLanguage, targetLanguage } = validatedFields.data;
    
    // --- Step 1: Generate Story Text ---
    const storyResult = await generateStory({ difficultyLevel: difficulty, sourceLanguage });
    if (!storyResult.story) {
      throw new Error('Failed to generate a story.');
    }
    const originalStory = storyResult.story;
    
    // --- Step 2: Translate Story ---
    const translationResult = await translateStory({
      storyText: originalStory,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
    });

    if (!translationResult || !translationResult.translatedText) {
      throw new Error('Failed to translate the story.');
    }
    const translatedText = translationResult.translatedText;

    // --- Step 3: Generate Speech (Raw PCM Data) ---
    const speechResult = await generateSpeech({ text: translatedText });
    if (!speechResult.audioUrl) {
        throw new Error('Speech synthesis failed to produce audio.');
    }

    // --- Step 4: Upload Audio to Firebase Storage ---
    const adminApp = initializeAdminApp();
    const storage = getStorage(adminApp);
    const firestore = getFirestore(adminApp);

    const storyDocRef = firestore.collection('users').doc(userId).collection('stories').doc();
    const storyId = storyDocRef.id;

    // Extract raw PCM data and encode to WAV
    const pcmDataUri = speechResult.audioUrl;
    const pcmBase64 = pcmDataUri.split(',')[1];
    const pcmBuffer = Buffer.from(pcmBase64, 'base64');
    const wavBase64 = await toWav(pcmBuffer);
    const wavBuffer = Buffer.from(wavBase64, 'base64');
    
    const storagePath = `stories/${userId}/${storyId}.wav`;
    const bucketName = firebaseConfig.storageBucket; // Use the correct bucket name from config
    const file = storage.bucket(bucketName).file(storagePath);
    
    await file.save(wavBuffer, {
        metadata: {
            contentType: 'audio/wav',
        },
    });

    // Generate a signed URL instead of making the file public
    const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '01-01-2030', // Set a long expiration date
    });

    // --- Step 5: Save Final Story to Firestore ---
    const storyData = {
        id: storyId,
        userId: userId,
        level: difficulty,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        nativeText: originalStory,
        translatedText: translatedText,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'complete',
        audioUrl: signedUrl, // Save the signed URL
    };
    
    await storyDocRef.set(storyData);
    
    // --- Step 6: Return immediately to the client ---
    return {
        storyData: {
            ...storyData,
            // Convert server timestamp to a client-compatible format
            createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        }
    };

  } catch (e) {
    console.error('Action Error:', e);
    const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: `Story creation failed. ${message}` };
  }
}

const snapshotSchema = z.object({
  userId: z.string(),
});

export async function createHistorySnapshot(values: z.infer<typeof snapshotSchema>) {
    try {
        const validatedFields = snapshotSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid user ID.' };
        }
        const { userId } = validatedFields.data;
        
        const adminApp = initializeAdminApp();
        const firestore = adminApp.firestore();

        // 1. Fetch all stories for the user
        const storiesRef = firestore.collection('users').doc(userId).collection('stories');
        const storiesSnapshot = await storiesRef.orderBy('createdAt', 'desc').get();

        if (storiesSnapshot.empty) {
            return { error: "No stories found to create a snapshot." };
        }

        const stories = storiesSnapshot.docs.map(doc => doc.data());

        // 2. Create the snapshot object
        const snapshotRef = firestore.collection('users').doc(userId).collection('historySnapshots').doc();
        const snapshotData = {
            id: snapshotRef.id,
            userId: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            storyCount: stories.length,
            stories: stories,
        };

        // 3. Save the new snapshot
        await snapshotRef.set(snapshotData);

        // 4. Batch delete the original stories
        const batch = firestore.batch();
        storiesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        return {
            success: true,
            snapshotId: snapshotRef.id,
            storyCount: stories.length,
        };

    } catch (e) {
        console.error('Snapshot Creation Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Snapshot creation failed. ${message}` };
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
        // This requires the Admin SDK, so we ensure it's initialized.
        initializeAdminApp();
        const result = await syncAllMembers();
        return { data: result };
    } catch (e) {
        console.error('Member Sync Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Member synchronization failed. ${message}` };
    }
}

const GenerateSvg3dInputSchema = z.object({
  prompt: z.string().describe('The user prompt to inspire the SVG design.'),
  width: z.number().describe('The width of the SVG image.'),
  height: z.number().describe('The height of the SVG image.'),
});

export async function generateSvg3dImage(values: z.infer<typeof GenerateSvg3dInputSchema>) {
    try {
        const validatedFields = GenerateSvg3dInputSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for SVG3D generation.' };
        }

        const result = await generateSvg3d(validatedFields.data);

        if (!result.svg) {
            return { error: 'Could not generate SVG3D image.' };
        }

        return { svg: result.svg };
    } catch (e) {
        console.error('SVG3D Generation Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `SVG3D generation failed. ${message}` };
    }
}
