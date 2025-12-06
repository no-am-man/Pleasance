
// src/app/actions.ts
'use server';

import { generateStoryAndSpeech } from '@/ai/flows/generate-story-and-speech';
import { generateCommunity as createCommunityDetails } from '@/ai/flows/generate-community';
import { refineCommunityPrompt as refineCommunityPromptAction } from '@/ai/flows/refine-community-prompt';
import { generateCommunityFlag as generateCommunityFlagAction } from '@/ai/flows/generate-flag';
import { generateSvg3d as generateSvg3dFlow } from '@/ai/flows/generate-svg3d';
import { saveSvgAsset as saveSvgAssetFlow } from '@/ai/flows/save-svg-asset';
import { welcomeNewMember as welcomeNewMemberAction } from '@/ai/flows/welcome-new-member';
import { notifyOwnerOfJoinRequest as notifyOwnerOfJoinRequestAction } from '@/ai/flows/notify-owner-of-join-request';
import { addBugReport as addBugReportAction } from '@/ai/tools/bug-reporter-tool';
import { 
    generateRoadmapIdea as generateRoadmapIdeaAction, 
} from '@/ai/flows/generate-roadmap-idea';
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
import { updateRoadmapCardColumn } from '@/ai/flows/update-roadmap-card-column';

import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export async function generateStoryAndSpeechAction(values: any) {
    return generateStoryAndSpeech(values);
}

export async function createCommunityDetailsAction(values: any) {
    return createCommunityDetails(values);
}

export { generateCommunityFlagAction };

export { refineCommunityPromptAction };

export async function generateSvg3dAction(values: any) {
    return generateSvg3dFlow(values);
}

export async function saveSvgAssetAction(values: any) {
    return saveSvgAssetFlow(values);
}

export async function getAiChatResponse(values: any) {
    // This is a placeholder for a dedicated chat flow
    return { response: "This is a placeholder AI response." };
}

export { welcomeNewMemberAction };

export { notifyOwnerOfJoinRequestAction };

export async function submitBugReportAction(values: any) {
    return addBugReportAction(values);
}

export { generateRoadmapIdeaAction };

export async function updateRoadmapCardColumnAction(cardId: string, sourceColumnId: string, targetColumnId: string) {
    return updateRoadmapCardColumn(cardId, sourceColumnId, targetColumnId);
}


export async function updateRoadmapCardOrderAction(columnId: string, cards: any[]) {
    return updateRoadmapCardOrder(columnId, cards);
}

export { refineRoadmapCardAction };

export { updateCardAssigneesAction };

export async function conductSuperAgent(values: { userId: string; prompt: string; }) {
    try {
        const { userId, prompt } = values;

        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const ambasedorDocRef = firestore.collection('ambasedor').doc(userId);
        const userProfileRef = firestore.collection('community-profiles').doc(userId);
        
        const [ambasedorDoc, userProfileDoc] = await Promise.all([ambasedorDocRef.get(), userProfileRef.get()]);

        if (!ambasedorDoc.exists) {
            await ambasedorDocRef.set({ history: [] });
        }
        const history = ambasedorDoc.exists ? ambasedorDoc.data()?.history || [] : [];
        const userName = userProfileDoc.exists() ? userProfileDoc.data()?.name || 'User' : 'User';

        // Call the internal Genkit flow
        const modelResponseParts = await conductSuperAgentFlow({ userId, userName, prompt, history });
        
        const userMessagePart = { role: 'user', content: [{ text: prompt }] };
        
        // This is a non-blocking update
        ambasedorDocRef.update({
            history: FieldValue.arrayUnion(userMessagePart, ...modelResponseParts),
        });

        return { data: modelResponseParts };

    } catch (e) {
        console.error('Ambasedor Action Error:', e);
        const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `Ambasedor action failed: ${message}` };
    }
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

export async function generateDualStory(values: { prompt: string, targetLanguage: string }) {
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
        createdAt: serverTimestamp(),
        storyCount: storyCount,
        stories: stories,
    };
    
    await snapshotRef.set(newSnapshot);
    return { storyCount: storyCount };
}
