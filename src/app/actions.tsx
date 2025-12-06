
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
import { refineRoadmapCard } from '@/ai/flows/refine-roadmap-card';
import { refineCommunityPrompt } from '@/ai/flows/refine-community-prompt';
import { updateCardAssignees } from '@/ai/flows/update-card-assignees';
import { generateRoadmapIdea } from '@/ai/flows/generate-roadmap-idea';
import { ambasedorFlow } from '@/ai/flows/ambasedor-flow';
import { initializeAdminApp } from '@/firebase/config-admin';
import { firebaseConfig } from '@/firebase/config';
import admin from 'firebase-admin';
import { generateCommunity } from '@/ai/flows/generate-community';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { ai } from '@/ai/genkit';
import { generateCommunityFlag } from '@/ai/flows/generate-flag';
import { welcomeNewMember } from '@/ai/flows/welcome-new-member';
import { notifyOwnerOfJoinRequest } from '@/ai/flows/notify-owner-of-join-request';
import { translateText } from '@/ai/flows/translate-text';
import {
    GenerateSvg3dInputSchema,
    type GenerateSvg3dInput,
    MemberSchema,
    RoadmapCardSchema,
    RoadmapColumnSchema,
    GenerateRoadmapIdeaOutputSchema,
    StorySchema
} from '@/lib/types';
import { addDocument } from '@/firebase/non-blocking-updates';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateDualStory(topic: string, targetLanguage: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    You are an expert language tutor for the LinguaTune app.
    
    Task:
    1. Write a short, engaging story (approx. 200 words) about: "${topic}".
    2. The story must be written in ${targetLanguage}.
    3. Provide a natural, fluent English translation.
    4. Extract key vocabulary words.
    5. Your output MUST be a valid JSON object that conforms to this Zod schema:
    ${JSON.stringify(StorySchema)}
    
    Requirements:
    - The story should be suitable for an intermediate learner (B1 level).
    - Use evocative language that conveys emotion effectively.
    - Ensure the translation captures the nuance, not just a literal word-for-word swap.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const parsedObject = JSON.parse(responseText);

  // Validate the object against the Zod schema before returning
  const validatedData = StorySchema.parse(parsedObject);

  return validatedData;
}


export type ChatWithMemberInput = {
    member: z.infer<typeof MemberSchema>;
    userMessage: string;
    history?: ChatHistory;
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
        const firestore = getFirestore(adminApp);

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
            createdAt: FieldValue.serverTimestamp(),
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
    includeAiAgents: z.boolean(),
});

export async function createCommunityDetails(values: z.infer<typeof communitySchema>) {
    try {
        const validatedFields = communitySchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid prompt.' };
        }

        const { prompt, includeAiAgents } = validatedFields.data;

        // Generate community details using the AI flow
        const communityDetails = await generateCommunity({ prompt, includeAiAgents });

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
        const result = await syncAllMembers();
        return { data: result };
    } catch (e) {
        console.error('Member Sync Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Member synchronization failed. ${message}` };
    }
}


const generateSvg3dSchema = GenerateSvg3dInputSchema.extend({
    creatorId: z.string(),
    creatorName: z.string(),
    creatorAvatarUrl: z.string().url().optional(),
    communityId: z.string(),
});

export async function generateSvg3d(values: z.infer<typeof generateSvg3dSchema>) {
    try {
        const validatedFields = generateSvg3dSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for SVG3D generation.' };
        }

        // 1. Generate the pixels from the AI flow
        const result = await generateSvg3dFlow(validatedFields.data);
        if (!result.pixels || result.pixels.length === 0) {
            return { error: 'The AI could not generate any pixels for this prompt.' };
        }
        
        // Don't save to Firestore if it's the personal workshop
        if (validatedFields.data.communityId === "personal-workshop") {
             return { 
                success: true,
                creation: {
                    id: 'temp-' + Date.now(),
                    creatorId: validatedFields.data.creatorId,
                    creatorName: validatedFields.data.creatorName,
                    creatorAvatarUrl: validatedFields.data.creatorAvatarUrl || '',
                    prompt: validatedFields.data.prompt,
                    createdAt: new Date().toISOString(),
                    pixels: result.pixels,
                    status: 'in-workshop'
                }
            };
        }


        // 2. Save the result as a new Creation document in the community's subcollection
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);

        const newCreationRef = firestore.collection('communities').doc(validatedFields.data.communityId).collection('creations').doc();
        
        const newCreation = {
            id: newCreationRef.id,
            creatorId: validatedFields.data.creatorId,
            creatorName: validatedFields.data.creatorName,
            creatorAvatarUrl: validatedFields.data.creatorAvatarUrl || '',
            prompt: validatedFields.data.prompt,
            createdAt: FieldValue.serverTimestamp(),
            pixels: result.pixels,
            status: 'in-workshop' as 'in-workshop' | 'published',
        };

        await newCreationRef.set(newCreation);
        
        // 3. Return the new creation data to the client
        return { 
            success: true,
            creation: {
                ...newCreation,
                createdAt: new Date().toISOString(), // Provide a client-side friendly timestamp
            }
        };

    } catch (e) {
        console.error('SVG3D Generation/Save Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `SVG3D creation failed: ${message}` };
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
            createdAt: FieldValue.serverTimestamp(),
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

const seedCommunityRoadmapSchema = z.object({
  communityId: z.string(),
});

export async function seedCommunityRoadmapData(values: z.infer<typeof seedCommunityRoadmapSchema>) {
    try {
        const { communityId } = seedCommunityRoadmapSchema.parse(values);

        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const batch = firestore.batch();
        
        const collectionRef = firestore.collection('communities').doc(communityId).collection('roadmap');

        const initialData = [
            { id: 'ideas', title: '💡 Ideas', cards: [
                { id: 'idea1', title: "Community Welcome Bot", description: "Create an AI agent that greets new members.", tags: ["AI", "Onboarding"] },
            ]},
            { id: 'nextUp', title: '🚀 Next Up!', cards: []},
            { id: 'inProgress', title: '🏗️ In Progress', cards: []},
            { id: 'alive', title: '✅ Alive', cards: [
                { id: 'alive1', title: "Establish Community", description: "Create the community and invite the first members.", tags: ["Foundation"], assignees: [] },
            ]},
        ];

        initialData.forEach(column => {
            const docRef = collectionRef.doc(column.id);
            batch.set(docRef, column);
        });

        await batch.commit();

        return { success: true, message: 'Community roadmap data seeded successfully.' };

    } catch (e) {
        console.error('Community Seeding Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to seed community roadmap data: ${message}` };
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
            });
            
            await storageFile.makePublic();
            
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
            createdAt: FieldValue.serverTimestamp(),
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

    const oldColumnRef = firestore.doc(`roadmap/${oldColumnId}`);
    const newColumnRef = firestore.doc(`roadmap/${newColumnId}`);

    const oldColumnSnap = await oldColumnRef.get();

    if (!oldColumnSnap.exists) {
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
      cards: FieldValue.arrayRemove(cardToMove)
    });

    // Add card to new column
    batch.update(newColumnRef, {
      cards: FieldValue.arrayUnion(cardToMove)
    });

    await batch.commit();

    return { success: true };

  } catch (e) {
    console.error('Update Roadmap Card Error:', e);
    const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: `Failed to move card: ${message}` };
  }
}

const AddRoadmapCardSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long."),
    description: z.string().min(10, "Description must be at least 10 characters long."),
});

export async function addRoadmapCard(values: z.infer<typeof AddRoadmapCardSchema>) {
    try {
        const validatedFields = AddRoadmapCardSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input.' };
        }
        
        const { title, description } = validatedFields.data;

        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);

        // Generate a new unique ID for the card
        const newCardId = firestore.collection('tmp').doc().id;

        const newCard = {
            id: newCardId,
            title,
            description,
            tags: ['New Idea'],
            assignees: [],
        };
        
        const ideasColumnRef = firestore.collection('roadmap').doc('ideas');

        await ideasColumnRef.update({
            cards: FieldValue.arrayUnion(newCard)
        });

        return { success: true, card: newCard };

    } catch (e) {
        console.error('Add Roadmap Card Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to add new idea: ${message}` };
    }
}

export async function deleteRoadmapCard(cardId: string, columnId: string) {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        
        const columnRef = firestore.collection('roadmap').doc(columnId);
        const columnSnap = await columnRef.get();

        if (!columnSnap.exists) {
            throw new Error(`Column "${columnId}" not found.`);
        }

        const columnData = columnSnap.data() as z.infer<typeof RoadmapColumnSchema>;
        const cardToDelete = columnData.cards.find(c => c.id === cardId);

        if (!cardToDelete) {
            throw new Error(`Card with ID "${cardId}" not found in column "${columnId}".`);
        }

        await columnRef.update({
            cards: FieldValue.arrayRemove(cardToDelete)
        });

        return { success: true };

    } catch (e) {
        console.error('Delete Roadmap Card Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to delete card: ${message}` };
    }
}

export async function updateRoadmapCardOrder(columnId: string, orderedCards: z.infer<typeof RoadmapCardSchema>[]) {
    try {
        if (columnId !== 'ideas') {
            return { error: "Reordering is only allowed in the 'Ideas' column." };
        }
        
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);

        const columnRef = firestore.collection('roadmap').doc(columnId);

        await columnRef.update({
            cards: orderedCards
        });

        return { success: true };

    } catch (e) {
        console.error('Update Roadmap Card Order Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to reorder cards: ${message}` };
    }
}


const RefineCardSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().optional(),
});

export async function refineCardDescription(values: z.infer<typeof RefineCardSchema>) {
    try {
        const validatedFields = RefineCardSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for refinement.' };
        }

        const result = await refineRoadmapCard(validatedFields.data);

        if (!result.refinedDescription) {
            return { error: 'AI failed to generate a description.' };
        }

        return { refinedDescription: result.refinedDescription };
    } catch (e) {
        console.error('Refine Card Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to refine description: ${message}` };
    }
}


const RefineCommunityPromptSchema = z.object({
    prompt: z.string().min(3, "Prompt must be at least 3 characters long."),
});

export async function refineCommunityPromptAction(values: z.infer<typeof RefineCommunityPromptSchema>) {
    try {
        const validatedFields = RefineCommunityPromptSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for refinement.' };
        }

        const result = await refineCommunityPrompt(validatedFields.data);

        if (!result.refinedPrompt) {
            return { error: 'AI failed to generate a refined prompt.' };
        }

        return { refinedPrompt: result.refinedPrompt };
    } catch (e) {
        console.error('Refine Community Prompt Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to refine prompt: ${message}` };
    }
}

const UpdateAssigneesSchema = z.object({
  columnId: z.string(),
  cardId: z.string(),
  assigneeName: z.string(),
  shouldAssign: z.boolean(),
});

export async function updateRoadmapCardAssignees(values: z.infer<typeof UpdateAssigneesSchema>) {
    try {
        const validatedFields = UpdateAssigneesSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input.' };
        }
        
        const result = await updateCardAssignees(validatedFields.data);

        if (result.error) {
            return { error: result.error };
        }
        return { success: true, newAssignees: result.newAssignees };

    } catch (e) {
        console.error('Update Assignees Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to update assignees: ${message}` };
    }
}

const ConductSuperAgentSchema = z.object({
    userId: z.string(),
    prompt: z.string(),
});

export async function conductSuperAgent(values: z.infer<typeof ConductSuperAgentSchema>) {
    try {
        const validatedFields = ConductSuperAgentSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for Ambasedor.' };
        }
        
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        
        const userProfileRef = firestore.collection('community-profiles').doc(validatedFields.data.userId);
        const userProfileSnap = await userProfileRef.get();
        const userName = userProfileSnap.exists ? userProfileSnap.data()?.name : 'Anonymous';

        const result = await ambasedorFlow({ ...validatedFields.data, userName });
        
        return { data: result };

    } catch (e) {
        console.error('Ambasedor Action Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Ambasedor action failed: ${message}` };
    }
}


const GenerateRoadmapIdeaSchema = z.object({
    prompt: z.string().min(3, "Prompt must be at least 3 characters long."),
});

export async function generateRoadmapIdeaAction(values: z.infer<typeof GenerateRoadmapIdeaSchema>) {
    try {
        const validatedFields = GenerateRoadmapIdeaSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for idea generation.' };
        }

        const result = await generateRoadmapIdea(validatedFields.data);
        
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const newCardId = firestore.collection('tmp').doc().id;
        
        const newCard: z.infer<typeof RoadmapCardSchema> = {
            id: newCardId,
            title: result.title,
            description: result.description,
            tags: result.tags,
            assignees: [],
        };
        
        const ideasColumnRef = firestore.collection('roadmap').doc('ideas');
        await ideasColumnRef.update({
            cards: FieldValue.arrayUnion(newCard)
        });

        return { success: true, card: newCard };

    } catch (e) {
        console.error('Generate Roadmap Idea Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to generate and add new idea: ${message}` };
    }
}

const storyTextSchema = z.object({
    userId: z.string(),
    userName: z.string(),
    userAvatar: z.string(),
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
      
      const { userId, userName, userAvatar, difficulty, sourceLanguage, targetLanguage } = validatedFields.data;
      
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
  
      // --- Step 3: Generate Speech (WAV Data) ---
      const speechResult = await generateSpeech({ text: translatedText });
      if (!speechResult.audioUrl) {
          throw new Error('Speech synthesis failed to produce audio.');
      }
  
      // --- Step 4: Initialize Admin App and services ---
      const adminApp = initializeAdminApp();
      const storage = getStorage(adminApp);
      const firestore = getFirestore(adminApp);
      const storyDocRef = firestore.collection('users').doc(userId).collection('stories').doc();
      const storyId = storyDocRef.id;
  
      // --- Step 5: Upload Audio to Firebase Storage ---
      const wavDataUri = speechResult.audioUrl;
      const wavBase64 = wavDataUri.split(',')[1];
      const audioBuffer = Buffer.from(wavBase64, 'base64');
      
      const storagePath = `stories/${userId}/${storyId}.wav`;
      const bucketName = firebaseConfig.storageBucket;
      const file = storage.bucket(bucketName).file(storagePath);
      
      await file.save(audioBuffer, {
          metadata: { contentType: 'audio/wav' },
      });
  
      await file.makePublic();
      const publicUrl = file.publicUrl();
  
      // --- Step 6: Save Final Story to Firestore ---
      const storyData = {
          id: storyId,
          userId: userId,
          level: difficulty,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
          nativeText: originalStory,
          translatedText: translatedText,
          createdAt: FieldValue.serverTimestamp(),
          status: 'complete' as const,
          audioUrl: publicUrl,
      };
      
      await storyDocRef.set(storyData);
      
      // --- Step 7: Update Leaderboard ---
      const leaderboardRef = firestore.collection('leaderboard').doc(userId);
      const points = { beginner: 10, intermediate: 20, advanced: 30 };
      const scoreIncrement = points[difficulty];
  
      await leaderboardRef.set({
          userId: userId,
          userName: userName,
          avatarUrl: userAvatar,
          score: FieldValue.increment(scoreIncrement),
          lastActivity: FieldValue.serverTimestamp(),
      }, { merge: true });
      
      // --- Step 8: Return a client-safe object ---
      const clientSafeStoryData = {
        ...storyData,
        createdAt: new Date().toISOString(), // Use a serializable format
      };

      return {
          storyData: clientSafeStoryData
      };
  
    } catch (e) {
      console.error('Action Error:', e);
      const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
      return { error: `Story creation failed. ${message}` };
    }
  }

const flagActionSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    communityDescription: z.string(),
    idToken: z.string(),
});

export async function generateCommunityFlagAction(values: z.infer<typeof flagActionSchema>) {
    return generateCommunityFlag(values);
}

export async function updateCommunityRoadmapCardColumn(
  communityId: string,
  cardId: string,
  oldColumnId: string,
  newColumnId: string
) {
  try {
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);

    const oldColumnRef = firestore.doc(`communities/${communityId}/roadmap/${oldColumnId}`);
    const newColumnRef = firestore.doc(`communities/${communityId}/roadmap/${newColumnId}`);

    const oldColumnSnap = await oldColumnRef.get();

    if (!oldColumnSnap.exists) {
      throw new Error(`Source column "${oldColumnId}" not found.`);
    }

    const oldColumnData = oldColumnSnap.data() as z.infer<typeof RoadmapColumnSchema>;
    const cardToMove = oldColumnData.cards.find(c => c.id === cardId);

    if (!cardToMove) {
      throw new Error(`Card with ID "${cardId}" not found in column "${oldColumnId}".`);
    }

    const batch = firestore.batch();

    batch.update(oldColumnRef, {
      cards: FieldValue.arrayRemove(cardToMove)
    });
    batch.update(newColumnRef, {
      cards: FieldValue.arrayUnion(cardToMove)
    });

    await batch.commit();

    return { success: true };

  } catch (e) {
    console.error('Update Community Roadmap Card Error:', e);
    const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: `Failed to move card: ${message}` };
  }
}

const welcomeNewMemberSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    newMemberName: z.string(),
});

export async function welcomeNewMemberAction(values: z.infer<typeof welcomeNewMemberSchema>) {
    try {
        const validatedFields = welcomeNewMemberSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for welcoming new member.' };
        }

        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);

        // Fetch community to get Concierge bio
        const communityDoc = await firestore.collection('communities').doc(validatedFields.data.communityId).get();
        if (!communityDoc.exists) {
            throw new Error("Community not found.");
        }
        const communityData = communityDoc.data();
        const concierge = communityData?.members.find((m: any) => m.name === 'Concierge');

        if (!concierge) {
            // If no concierge, just return success without doing anything.
            return { success: true };
        }
        
        const result = await welcomeNewMember({
            ...validatedFields.data,
            conciergeBio: concierge.bio,
        });

        if (!result.success) {
            return { error: result.error || 'Failed to generate and post welcome message.' };
        }

        return { success: true };

    } catch (e) {
        console.error('Welcome New Member Action Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to welcome new member: ${message}` };
    }
}
    
const notifyOwnerSchema = z.object({
    communityId: z.string(),
    communityName: z.string(),
    requestingUserName: z.string(),
});

export async function notifyOwnerOfJoinRequestAction(values: z.infer<typeof notifyOwnerSchema>) {
    try {
        const validatedFields = notifyOwnerSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for notification.' };
        }

        const result = await notifyOwnerOfJoinRequest(validatedFields.data);

        if (!result.success) {
            return { error: result.error || 'Failed to send notification.' };
        }

        return { success: true };

    } catch (e) {
        console.error('Notify Owner Action Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to send notification: ${message}` };
    }
}
    
const TranslateTextSchema = z.object({
    text: z.string(),
    targetLanguage: z.string(),
});

export async function translateTextAction(values: z.infer<typeof TranslateTextSchema>) {
    try {
        const validatedFields = TranslateTextSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for translation.' };
        }

        const result = await translateText(validatedFields.data);

        if (!result.translation) {
            return { error: 'AI failed to translate the text.' };
        }

        return { translation: result.translation };

    } catch (e) {
        console.error('Translate Text Action Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Translation failed: ${message}` };
    }
}

    
