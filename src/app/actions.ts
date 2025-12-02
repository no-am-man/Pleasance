
'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';
import { chatWithMember, ChatWithMemberInput } from '@/ai/flows/chat-with-member';
import { generateSpeech } from '@/ai/flows/generate-speech';
import { generateAvatars } from '@/ai/flows/generate-avatars';
import { syncAllMembers } from '@/ai/flows/sync-members';
import { initializeAdminApp } from '@/firebase/config-admin';
import admin from 'firebase-admin';
import { generateCommunity } from '@/ai/flows/generate-community';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import wav from 'wav';


const storyTextSchema = z.object({
  userId: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
});

export async function generateStoryAndSpeech(values: z.infer<typeof storyTextSchema>) {
  try {
    const validatedFields = storyTextSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: 'Invalid input.' };
    }
    
    const { userId, difficulty, sourceLanguage, targetLanguage } = validatedFields.data;
    
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

    // --- Step 2: Save Initial Story to Firestore ---
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);
    const storyDocRef = firestore.collection('users').doc(userId).collection('stories').doc();
    const storyId = storyDocRef.id;

    const initialStoryData = {
        id: storyId,
        userId: userId,
        level: difficulty,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        nativeText: originalStory,
        translatedText: translatedText,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'processing', // Initial status
    };
    
    await storyDocRef.set(initialStoryData);
    
    // --- Step 3: Trigger background audio processing (don't await this function) ---
    processAudioInBackground(storyId, userId, translatedText);
    
    // --- Step 4: Return immediately to the client ---
    return {
        storyData: {
            ...initialStoryData,
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

async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs));
    });

    writer.write(pcmData);
    writer.end();
  });
}


async function processAudioInBackground(storyId: string, userId: string, textToSpeak: string) {
    try {
        const speechResult = await generateSpeech({ text: textToSpeak });
        if (!speechResult.audioBase64) {
            throw new Error('Speech synthesis failed to produce audio.');
        }

        const adminApp = initializeAdminApp();
        const storage = getStorage(adminApp);
        const firestore = getFirestore(adminApp);
        
        const storagePath = `stories/${userId}/${storyId}.wav`;
        const file = storage.bucket().file(storagePath);
        
        const pcmBuffer = Buffer.from(speechResult.audioBase64, 'base64');
        const wavBuffer = await toWav(pcmBuffer);


        await file.save(wavBuffer, {
            metadata: {
                contentType: 'audio/wav',
            },
        });
        
        const [downloadURL] = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491' // A very long expiration date
        });

        const storyDocRef = firestore.collection('users').doc(userId).collection('stories').doc(storyId);
        await storyDocRef.update({ 
            audioUrl: downloadURL,
            status: 'complete',
        });

    } catch (e) {
        console.error(`Background audio processing failed for story ${storyId}:`, JSON.stringify(e, null, 2));
        // Optionally update the story doc to indicate failure
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const storyDocRef = firestore.collection('users').doc(userId).collection('stories').doc(storyId);
        await storyDocRef.update({ status: 'failed', error: e instanceof Error ? e.message : String(e) });
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
