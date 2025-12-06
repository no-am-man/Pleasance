// src/app/actions.ts
'use server';

import { generateStoryAndSpeech } from '@/ai/flows/generate-story-and-speech';
import { generateCommunity } from '@/ai/flows/generate-community';
import { refineCommunityPrompt as refineCommunityPromptAction } from '@/ai/flows/refine-community-prompt';
import { generateCommunityFlag as generateCommunityFlagAction } from '@/ai/flows/generate-flag';
import { generateSvg3d as generateSvg3dFlow } from '@/ai/flows/generate-svg3d';
import { saveSvgAsset as saveSvgAssetFlow } from '@/ai/flows/save-svg-asset';
import { welcomeNewMember as welcomeNewMemberAction } from '@/ai/flows/welcome-new-member';
import { notifyOwnerOfJoinRequest as notifyOwnerOfJoinRequestAction } from '@/ai/flows/notify-owner-of-join-request';
import { addBugReportTool as addBugReportAction } from '@/ai/tools/bug-reporter-tool';
import { generateRoadmapIdea as generateRoadmapIdeaAction } from '@/ai/flows/generate-roadmap-idea';
import { conductSuperAgent as conductSuperAgentFlow } from '@/ai/flows/ambasedor';
import { seedRoadmapData as seedRoadmapDataFlow } from '@/lib/seed-roadmap';
import { syncAllMembers as syncAllMembersAction } from '@/ai/flows/sync-members';
import { translateText as translateTextAction } from '@/ai/flows/translate-text';
import { seedCommunityRoadmapData as seedCommunityRoadmapAction } from '@/lib/seed-roadmap';
import { updateRoadmapCardOrder } from '@/ai/flows/update-card-order';
import { refineRoadmapCard as refineRoadmapCardAction } from '@/ai/flows/refine-roadmap-card';
import { updateCommunityRoadmapCardColumn as updateCommunityRoadmapCardColumnAction } from '@/ai/flows/update-community-roadmap-column';
import { generateDualStory as generateDualStoryFlow } from '@/ai/flows/generate-dual-story';
import { updateCardAssignees as updateCardAssigneesAction } from '@/ai/flows/update-card-assignees';
import { updateRoadmapCardColumn as updateRoadmapCardColumnAction } from '@/ai/flows/update-roadmap-card-column';
import { generateProfileAvatars } from '@/ai/flows/generate-avatars';

import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue, arrayUnion, arrayRemove } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';


export async function generateStoryAndSpeechAction(values: any) {
    return generateStoryAndSpeech(values);
}

export async function createCommunityDetailsAction(values: any) {
    return generateCommunity(values);
}

export { generateCommunityFlagAction };
export { refineCommunityPromptAction };

export async function generateSvg3dAction(values: any) {
    return generateSvg3dFlow(values);
}

export async function saveSvgAssetAction(values: any) {
    return saveSvgAssetFlow(values);
}

export { welcomeNewMemberAction };
export { notifyOwnerOfJoinRequestAction };

export async function submitBugReportAction(values: any) {
    return addBugReportAction(values);
}

export { generateRoadmapIdeaAction };
export { updateRoadmapCardColumnAction };
export { updateRoadmapCardOrder as updateRoadmapCardOrderAction };
export { refineRoadmapCardAction };
export { updateCardAssigneesAction };

export async function conductSuperAgentAction(values: { userId: string; prompt: string; }) {
    return conductSuperAgentFlow(values);
}

export async function runMemberSync() {
    try {
        const result = await syncAllMembersAction();
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

export { translateTextAction };
export { updateCommunityRoadmapCardColumnAction };

export async function seedCommunityRoadmapData(values: { communityId: string }) {
     try {
        const result = await seedCommunityRoadmapAction(values);
        return { message: result };
    } catch(e) {
        return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
}

export async function generateDualStoryAction(values: { prompt: string, targetLanguage: string }) {
    return generateDualStoryFlow(values);
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
    // This is a placeholder for a server action that would handle file uploads.
    // In a real app, this would involve a library like Multer for Express or similar for Next.js API routes.
    // For now, we'll just return a success message.
    return { success: true, message: 'Asset declared (file upload placeholder).' };
}

export { generateProfileAvatars as generateProfileAvatarsAction };
