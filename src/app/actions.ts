
'use server';

import { z } from 'zod';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';
import { chatWithMember } from '@/ai/flows/chat-with-member';
import type { ChatHistory } from 'genkit';
import { generateSpeech } from '@/ai/flows/generate-speech';
import { generateAvatars } from '@/ai/flows/generate-avatars';
import { syncAllMembers } from '@/ai/flows/sync-members';
import { generateSvg3d as generateSvg3dFlow } from '@/ai/flows/generate-svg3d';
import { initializeAdminApp } from '@/firebase/config-admin';
import { firebaseConfig } from '@/firebase/config';
import admin from 'firebase-admin';
import { generateCommunity } from '@/ai/flows/generate-community';
import { getFirestore, writeBatch, doc, updateDoc, arrayRemove, arrayUnion } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import wav from 'wav';
import {
    GenerateSvg3dInputSchema,
    type GenerateSvg3dInput,
    MemberSchema,
    RoadmapCardSchema,
    RoadmapColumnSchema
} from '@/lib/types';


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

    // Make the file public and get its URL
    await file.makePublic();
    const publicUrl = file.publicUrl();

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
        audioUrl: publicUrl, // Save the public URL
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

export async function generateSvg3d(values: GenerateSvg3dInput) {
    try {
        const validatedFields = GenerateSvg3dInputSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for SVG3D generation.' };
        }

        const result = await generateSvg3dFlow(validatedFields.data);

        if (!result.pixels) {
            return { error: 'Could not generate SVG3D image.' };
        }

        return { pixels: result.pixels };
    } catch (e) {
        console.error('SVG3D Generation Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `SVG3D generation failed: ${message}` };
    }
}

const saveSvgAssetSchema = z.object({
    userId: z.string(),
    assetName: z.string(),
    value: z.coerce.number().min(0),
    pixels: z.array(z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
        color: z.string(),
    })),
});

export async function saveSvgAsset(values: z.infer<typeof saveSvgAssetSchema>) {
    try {
        const validatedFields = saveSvgAssetSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for saving asset.' };
        }
        
        const { userId, assetName, value, pixels } = validatedFields.data;

        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const storage = getStorage(adminApp);

        const assetDocRef = firestore.collection('users').doc(userId).collection('assets').doc();
        const assetId = assetDocRef.id;

        const jsonString = JSON.stringify({ pixels });
        const jsonBuffer = Buffer.from(jsonString, 'utf-8');
        
        const storagePath = `users/${userId}/svg3d-assets/${assetId}.json`;
        const bucketName = firebaseConfig.storageBucket;
        const file = storage.bucket(bucketName).file(storagePath);
        
        await file.save(jsonBuffer, {
            metadata: { contentType: 'application/json' },
        });

        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;

        const assetData = {
            id: assetId,
            ownerId: userId,
            name: assetName,
            description: `A generative 3D artwork. Stored at: ${publicUrl}`,
            type: 'ip' as 'ip' | 'physical' | 'virtual',
            value: value, 
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            fileUrl: publicUrl, // Storing the direct public file URL for easier access
        };

        await assetDocRef.set(assetData);

        return { success: true, assetId: assetId };

    } catch (e) {
        console.error('Save Asset Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to save asset: ${message}` };
    }
}

export async function seedRoadmapData() {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const batch = firestore.batch();

        const initialData = [
            { id: 'ideas', title: '💡 Ideas', cards: [
                { id: 'idea1', title: "Gamify Language Learning", description: "Add points, streaks, and leaderboards to Nuncy Lingua.", tags: ["Nuncy Lingua", "UX"] },
                { id: 'idea2', title: "Decentralized Identity", description: "Explore using DIDs for user profiles.", tags: ["Identity", "Web3"] },
            ]},
            { id: 'nextUp', title: '🚀 Next Up!', cards: [
                { id: 'next1', title: "Dynamic Kanban Board", description: "Connect this roadmap to a database for real-time updates.", tags: ["Roadmap", "Backend"], assignees: ["Gemini"] },
                { id: 'next2', title: "Community Moderation Tools", description: "Allow community owners to manage posts and members.", tags: ["Community"], assignees: ["Noam"] },
            ]},
            { id: 'inProgress', title: '🏗️ In Progress', cards: [
                { id: 'prog1', title: "Fabrication Ticketing System", description: "Build the UI and backend for managing fabrication orders.", tags: ["Fabrication"], assignees: ["Noam", "Gemini"] },
            ]},
            { id: 'alive', title: '✅ Alive', cards: [
                { id: 'alive1', title: "Collaborative AI Workshop", description: "A real-time, shared space for generative AI experimentation.", tags: ["Workshop", "AI"], assignees: ["Gemini"] },
                { id: 'alive2', title: "Community Federation", description: "Create and manage your own sovereign communities.", tags: ["Community"], assignees: ["Noam"] },
                { id: 'alive3', title: "Nuncy Lingua Story Generator", description: "AI-powered story and speech generation for language learning.", tags: ["Nuncy Lingua"], assignees: ["Gemini"] },
            ]},
        ];

        initialData.forEach(column => {
            const docRef = firestore.collection('roadmap').doc(column.id);
            batch.set(docRef, column);
        });

        await batch.commit();

        return { success: true, message: 'Roadmap data seeded to Firestore successfully.' };

    } catch (e) {
        console.error('Seeding Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to seed roadmap data: ${message}` };
    }
}

export async function declareAssetWithFile(formData: FormData) {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const storage = getStorage(adminApp);
        const bucket = storage.bucket(firebaseConfig.storageBucket);

        const userId = formData.get('userId') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const type = formData.get('type') as 'physical' | 'virtual' | 'ip';
        const value = Number(formData.get('value'));
        const file = formData.get('file') as File | null;

        if (!userId) throw new Error('User ID is missing.');

        const assetsCollectionRef = firestore.collection('users').doc(userId).collection('assets');
        const newAssetRef = assetsCollectionRef.doc();
        const assetId = newAssetRef.id;

        let fileUrl: string | undefined = undefined;

        if (file && file.size > 0) {
            const storagePath = `users/${userId}/assets/${assetId}-${file.name}`;
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            const storageFile = bucket.file(storagePath);
            await storageFile.save(fileBuffer, {
                metadata: { contentType: file.type },
                public: true, // Make file publicly readable
            });
            fileUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
        }

        const newAsset = {
            id: assetId,
            ownerId: userId,
            name,
            description,
            type,
            value,
            fileUrl,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await newAssetRef.set(newAsset);

        return { success: true, asset: { ...newAsset, createdAt: new Date().toISOString() } };

    } catch (e) {
        console.error('Declare Asset Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to declare asset: ${message}` };
    }
}

export async function updateRoadmapCardColumn(
  cardId: string,
  oldColumnId: string,
  newColumnId: string
) {
  try {
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);

    const oldColumnRef = doc(firestore, 'roadmap', oldColumnId);
    const newColumnRef = doc(firestore, 'roadmap', newColumnId);

    const oldColumnSnap = await oldColumnRef.get();

    if (!oldColumnSnap.exists()) {
      throw new Error(`Source column "${oldColumnId}" not found.`);
    }

    const oldColumnData = oldColumnSnap.data() as z.infer<typeof RoadmapColumnSchema>;
    const cardToMove = oldColumnData.cards.find(c => c.id === cardId);

    if (!cardToMove) {
      throw new Error(`Card with ID "${cardId}" not found in column "${oldColumnId}".`);
    }

    const batch = firestore.batch();

    // Remove card from old column
    batch.update(oldColumnRef, {
      cards: arrayRemove(cardToMove)
    });

    // Add card to new column
    batch.update(newColumnRef, {
      cards: arrayUnion(cardToMove)
    });

    await batch.commit();

    return { success: true };

  } catch (e) {
    console.error('Update Roadmap Card Error:', e);
    const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: `Failed to move card: ${message}` };
  }
}
