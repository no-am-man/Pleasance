// src/app/actions.ts
'use server';

import { generateCommunity as generateCommunityFlow } from '@/ai/flows/generate-community';
import { refineCommunityPrompt as refineCommunityPromptFlow } from '@/ai/flows/refine-community-prompt';
import { generateCommunityFlag as generateCommunityFlagFlow } from '@/ai/flows/generate-flag';
import { generateSvg3d as generateSvg3dFlow } from '@/ai/flows/generate-svg3d';
import { saveSvgAsset as saveSvgAssetFlow } from '@/ai/flows/save-svg-asset';
import { welcomeNewMember as welcomeNewMemberFlow } from '@/ai/flows/welcome-new-member';
import { notifyOwnerOfJoinRequest as notifyOwnerOfJoinRequestFlow } from '@/ai/flows/notify-owner-of-join-request';
import { addBugReportTool as addBugReportFlow } from '@/ai/tools/bug-reporter-tool';
import { generateRoadmapIdea as generateRoadmapIdeaFlow } from '@/ai/flows/generate-roadmap-idea';
import { conductSuperAgent as conductSuperAgentFlow } from '@/ai/flows/ambasedor';
import { seedRoadmapData as seedRoadmapDataFlow } from '@/lib/seed-roadmap';
import { syncAllMembers as syncAllMembersFlow } from '@/ai/flows/sync-members';
import { translateText as translateTextFlow } from '@/ai/flows/translate-text';
import { seedCommunityRoadmapData as seedCommunityRoadmapFlow } from '@/lib/seed-roadmap';
import { updateRoadmapCardOrder as updateRoadmapCardOrderFlow } from '@/ai/flows/update-card-order';
import { refineRoadmapCard as refineRoadmapCardFlow } from '@/ai/flows/refine-roadmap-card';
import { updateCommunityRoadmapCardColumn as updateCommunityRoadmapCardColumnFlow } from '@/ai/flows/update-community-roadmap-column';
import { generateDualStory as generateDualStoryFlow } from '@/ai/flows/generate-dual-story';
import { updateCardAssignees as updateCardAssigneesFlow } from '@/ai/flows/update-card-assignees';
import { updateRoadmapCardColumn as updateRoadmapCardColumnFlow } from '@/ai/flows/update-roadmap-card-column';
import { generateProfileAvatars as generateProfileAvatarsFlow } from '@/ai/flows/generate-avatars';
import { analyzeAcademicLevel as analyzeAcademicLevelFlow } from '@/ai/flows/analyze-academic-level';
import { generateStory as generateStoryFlow } from '@/ai/flows/generate-story';
import { translateStory as translateStoryFlow } from '@/ai/flows/translate-story';
import { generateSpeech as generateSpeechFlow } from '@/ai/flows/generate-speech';
import { analyzeStudiesAndBoostCommunityTool as analyzeStudiesAndBoostCommunityFlow } from '@/ai/tools/academic-analyzer-tool';

import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue, arrayUnion, arrayRemove } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Each exported function is now an explicit async function wrapper.

export async function createCommunityDetailsAction(values: any) {
    return await generateCommunityFlow(values);
}

export async function generateCommunityFlagAction(values: any) {
    return await generateCommunityFlagFlow(values);
}

export async function refineCommunityPromptAction(values: any) {
    return await refineCommunityPromptFlow(values);
}

export async function generateSvg3dAction(values: any) {
    return await generateSvg3dFlow(values);
}

export async function saveSvgAssetAction(values: any) {
    return await saveSvgAssetFlow(values);
}

export async function welcomeNewMemberAction(values: any) {
    return await welcomeNewMemberFlow(values);
}

export async function notifyOwnerOfJoinRequestAction(values: any) {
    return await notifyOwnerOfJoinRequestFlow(values);
}

export async function submitBugReportAction(values: any) {
    return await addBugReportFlow(values);
}

export async function generateRoadmapIdeaAction(values: any) {
    return await generateRoadmapIdeaFlow(values);
}

export async function updateRoadmapCardColumnAction(cardId: string, sourceColumnId: string, targetColumnId: string) {
    return await updateRoadmapCardColumnFlow(cardId, sourceColumnId, targetColumnId);
}

export async function updateRoadmapCardOrderAction(columnId: string, cards: any[]) {
    return await updateRoadmapCardOrderFlow(columnId, cards);
}

export async function refineRoadmapCardAction(values: any) {
    return await refineRoadmapCardFlow(values);
}

export async function updateCardAssigneesAction(values: any) {
    return await updateCardAssigneesFlow(values);
}

export async function conductSuperAgentAction(values: { userId: string; prompt: string; }) {
    return await conductSuperAgentFlow(values);
}

export async function runMemberSync() {
    try {
        const result = await syncAllMembersFlow();
        return { data: result };
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
}

export async function seedRoadmapData() {
    try {
        const result = await seedRoadmapDataFlow();
        return { message: result };
    } catch(e) {
        return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
}

export async function translateTextAction(values: any) {
    return await translateTextFlow(values);
}

export async function updateCommunityRoadmapCardColumnAction(communityId: string, cardId: string, sourceColumnId: string, targetColumnId: string) {
    return await updateCommunityRoadmapCardColumnFlow(communityId, cardId, sourceColumnId, targetColumnId);
}

export async function seedCommunityRoadmapData(values: { communityId: string }) {
     try {
        const result = await seedCommunityRoadmapFlow(values);
        return { message: result };
    } catch(e) {
        return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
}

export async function generateDualStoryAction(values: any) {
    return await generateDualStoryFlow(values);
}

export async function generateStoryAction(values: any) {
    return await generateStoryFlow(values);
}

export async function translateStoryAction(values: any) {
    return await translateStoryFlow(values);
}

export async function generateSpeechAction(values: { text: string; }) {
    try {
        const result = await generateSpeechFlow(values);
        if (result.error) {
            throw new Error(result.error);
        }
        return { audioUrl: result.audioUrl };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred while generating speech.';
        console.error("generateSpeechAction failed:", message);
        
        let userFriendlyError = `AI speech generation failed: ${message}`;
        if (message.includes('PERMISSION_DENIED')) {
            userFriendlyError = `AI speech generation failed due to a permissions error. Please ensure the 'Vertex AI API' is enabled in your Google Cloud project and that your server environment has the correct Application Default Credentials.`;
        }

        return { error: userFriendlyError };
    }
}

export async function createHistorySnapshot(values: { userId: string }) {
    const { userId } = values;
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);
    const storiesRef = firestore.collection(`users/${userId}/stories`);
    const snapshotRef = firestore.collection(`users/${userId}/historySnapshots`).doc();

    const storiesSnapshot = await storiesRef.orderBy('createdAt', 'desc').get();
    const stories = storiesSnapshot.docs.map(doc => doc.data());
    const storyCount = stories.length;

    if (storyCount === 0) {
        return { error: "No stories in history to snapshot." };
    }

    const newSnapshot = {
        id: snapshotRef.id,
        userId: userId,
        createdAt: FieldValue.serverTimestamp(),
        storyCount: storyCount,
        stories: stories,
    };
    
    await snapshotRef.set(newSnapshot);
    return { storyCount: storyCount };
}

export async function addRoadmapCardAction(values: { title: string, description: string }) {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const ideasRef = firestore.collection('roadmap').doc('ideas');
        
        await ideasRef.update({
            cards: FieldValue.arrayUnion({
                id: uuidv4(),
                title: values.title,
                description: values.description,
                tags: ['new-idea'],
                assignees: [],
            })
        });
        return { success: true };
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' };
    }
}

export async function deleteRoadmapCardAction(cardId: string, columnId: string) {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const columnRef = firestore.collection('roadmap').doc(columnId);
        
        const columnDoc = await columnRef.get();
        if (!columnDoc.exists) {
            throw new Error('Column not found');
        }
        
        const columnData = columnDoc.data();
        const cardToRemove = columnData?.cards.find((c: any) => c.id === cardId);
        
        if (cardToRemove) {
            await columnRef.update({
                cards: arrayRemove(cardToRemove)
            });
        }
        
        return { success: true };
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' };
    }
}

export async function declareAssetWithFileAction(formData: FormData) {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);

        const userId = formData.get('userId') as string;
        const assetName = formData.get('name') as string;
        const description = formData.get('description') as string;
        const type = formData.get('type') as 'physical' | 'virtual' | 'ip';
        const value = Number(formData.get('value'));
        const communityId = formData.get('communityId') as string | null;

        if (!userId || !assetName || !description || !type || isNaN(value)) {
            throw new Error("Missing required form fields.");
        }

        const isCommunityAsset = communityId && communityId !== 'private';
        const collectionPath = isCommunityAsset ? `communities/${communityId}/assets` : `users/${userId}/assets`;
        
        const assetColRef = firestore.collection(collectionPath);
        const newAssetRef = assetColRef.doc(); // Generate a new document reference with an ID
        
        const assetData = {
            id: newAssetRef.id,
            ownerId: userId,
            name: assetName,
            description,
            type,
            value,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            communityId: isCommunityAsset ? communityId : null,
        };

        await newAssetRef.set(assetData);

        return { success: true, message: 'Asset declared successfully.' };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Failed to declare asset: ${message}` };
    }
}

export async function generateProfileAvatarsAction(values: any) {
    return await generateProfileAvatarsFlow(values);
}

export async function analyzeAcademicLevelAction(values: { studies: string }) {
    return await analyzeAcademicLevelFlow(values);
}

export async function analyzeStudiesAndBoostCommunityAction(values: any) {
    return await analyzeStudiesAndBoostCommunityFlow(values);
}
