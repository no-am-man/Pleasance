// src/app/actions.ts
'use server';

import { generateStory, translateStory, generateSpeech } from '@/ai/flows/generate-story-and-speech';
import { generateCommunity, refineCommunityPrompt } from '@/ai/flows/create-community';
import { generateCommunityFlag } from '@/ai/flows/generate-flag';
import { generateSvg3d as generateSvg3dFlow, saveSvgAsset as saveSvgAssetFlow } from '@/ai/flows/generate-svg-3d-asset';
import { welcomeNewMember, notifyOwnerOfJoinRequest } from '@/ai/flows/community-actions';
import { addBugReport } from '@/ai/tools/bug-reporter-tool';
import { 
    generateRoadmapIdea, 
    addRoadmapCard, 
    updateRoadmapCardColumn, 
    updateRoadmapCardOrder, 
    refineRoadmapCard,
    updateCardAssignees
} from '@/ai/flows/roadmap-actions';
import { ambasedorFlow as conductSuperAgentFlow } from '@/ai/flows/ambasedor-flow';
import { seedRoadmapData as seedRoadmapDataFlow } from '@/lib/seed-roadmap';
import { syncAllMembers } from '@/ai/flows/sync-members';
import { translateText } from '@/ai/flows/translate-text';
import { seedCommunityRoadmapData as seedCommunityRoadmap } from '@/lib/seed-roadmap';

import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export async function generateStoryAndSpeechAction(values: any) {
    return generateStoryAndSpeech(values);
}

export async function createCommunityDetails(values: any) {
    return generateCommunity(values);
}

export async function generateCommunityFlagAction(values: any) {
    return generateCommunityFlag(values);
}

export async function refineCommunityPromptAction(values: any) {
    return refineCommunityPrompt(values);
}

export async function generateSvg3d(values: any) {
    return generateSvg3dFlow(values);
}

export async function saveSvgAsset(values: any) {
    return saveSvgAssetFlow(values);
}

export async function getAiChatResponse(values: any) {
    // This is a placeholder for a dedicated chat flow
    return { response: "This is a placeholder AI response." };
}

export async function welcomeNewMemberAction(values: any) {
    return welcomeNewMember(values);
}

export async function notifyOwnerOfJoinRequestAction(values: any) {
    return notifyOwnerOfJoinRequest(values);
}

export async function submitBugReportAction(values: any) {
    return addBugReport(values);
}

export async function generateRoadmapIdeaAction(values: any) {
    return generateRoadmapIdea(values);
}

export async function addRoadmapCardAction(values: any) {
    return addRoadmapCard(values);
}

export async function updateRoadmapCardColumnAction(cardId: string, oldColumnId: string, newColumnId: string) {
    return updateRoadmapCardColumn(cardId, oldColumnId, newColumnId);
}

export async function updateRoadmapCardOrderAction(columnId: string, cards: any[]) {
    return updateRoadmapCardOrder(columnId, cards);
}

export async function refineCardDescription(values: any) {
    return refineRoadmapCard(values);
}

export async function updateRoadmapCardAssignees(values: any) {
    return updateCardAssignees(values);
}

export async function deleteRoadmapCard(cardId: string, columnId: string) {
    // Placeholder for delete action
    console.log(`Deleting ${cardId} from ${columnId}`);
    return { success: true };
}

const AmbasedorInputSchema = z.object({
  userId: z.string(),
  prompt: z.string(),
});

export async function conductSuperAgent(values: z.infer<typeof AmbasedorInputSchema>) {
    try {
        const validatedFields = AmbasedorInputSchema.safeParse(values);
        if (!validatedFields.success) {
            return { error: 'Invalid input for Ambasedor.' };
        }
        
        const { userId, prompt } = validatedFields.data;

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
        const result = await syncAllMembers();
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
    return translateText(values);
}

export async function updateCommunityRoadmapCardColumn(communityId: string, cardId: string, oldColumnId: string, newColumnId: string) {
    // This is a placeholder for the actual implementation
    console.log(`Moving card ${cardId} from ${oldColumnId} to ${newColumnId} in community ${communityId}`);
    return { success: true };
}

export async function seedCommunityRoadmapData(values: { communityId: string }) {
     try {
        const result = await seedCommunityRoadmap(values);
        return { message: result };
    } catch(e) {
        return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
}

export async function generateDualStory(prompt: string, targetLanguage: string) {
    console.log("This function is not fully implemented yet.");
    return { error: "Not implemented" };
}
