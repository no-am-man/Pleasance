// src/app/actions.ts
'use server';

// This file acts as a FACADE for all server actions, providing a simplified
// interface to the rest of the application.

// --- Story & Language Actions ---
import { generateDualStory } from '@/ai/flows/generate-dual-story';
import { generateStory } from '@/ai/flows/generate-story';
import { translateStory } from '@/ai/flows/translate-story';
import { generateSpeech } from '@/ai/flows/generate-speech';
import { translateText } from '@/ai/flows/translate-text';

// --- Community & Member Actions ---
import { generateCommunity } from '@/ai/flows/generate-community';
import { refineCommunityPrompt } from '@/ai/flows/refine-community-prompt';
import { generateCommunityFlag } from '@/ai/flows/generate-flag';
import { welcomeNewMember } from '@/ai/flows/welcome-new-member';
import { notifyOwnerOfJoinRequest } from '@/ai/flows/notify-owner-of-join-request';
import { syncAllMembers } from '@/ai/flows/sync-members';
import { updateCommunityRoadmapCardColumn } from '@/ai/flows/update-community-roadmap-column';
import { generateProfileAvatars } from '@/ai/flows/generate-avatars';
import { echoThoughtForm as echoThoughtFormFlow } from './community-actions';

// --- Roadmap & Bug Actions ---
import { addBugReportTool } from '@/ai/tools/bug-reporter-tool';
import { generateRoadmapIdea } from '@/ai/flows/generate-roadmap-idea';
import { updateRoadmapCardColumn } from '@/ai/flows/update-roadmap-card-column';
import { updateRoadmapCardOrder } from '@/ai/flows/update-card-order';
import { refineRoadmapCard } from '@/ai/flows/refine-roadmap-card';
import { updateCardAssignees } from '@/ai/flows/update-card-assignees';

// --- AI & Agent Actions ---
import { conductSuperAgent } from '@/ai/flows/ambasedor';
import { generateSvg3d } from '@/ai/flows/generate-svg3d';
import { analyzeAcademicLevel } from '@/ai/flows/analyze-academic-level';
import { analyzeStudiesAndBoostCommunityTool } from '@/ai/tools/academic-analyzer-tool';

// --- Asset & Treasury Actions ---
import { saveSvgAsset } from '@/ai/flows/save-svg-asset';
import { declareAssetWithFileAction as declareAssetWithFile } from './asset-actions';

// --- System & Data Actions ---
import { seedPlatformData as seedPlatformDataFlow } from '@/lib/seed-roadmap';
import { createHistorySnapshot as createHistorySnapshotFlow } from './snapshot-actions';
import { addRoadmapCard as addRoadmapCardFlow, deleteRoadmapCard as deleteRoadmapCardFlow } from './roadmap-actions';


// Re-exporting all actions to maintain the facade
export const createCommunityDetailsAction = generateCommunity;
export const generateCommunityFlagAction = generateCommunityFlag;
export const refineCommunityPromptAction = refineCommunityPrompt;
export const generateSvg3dAction = generateSvg3d;
export const saveSvgAssetAction = saveSvgAsset;
export const welcomeNewMemberAction = welcomeNewMember;
export const notifyOwnerOfJoinRequestAction = notifyOwnerOfJoinRequest;
export const submitBugReportAction = addBugReportTool;
export const generateRoadmapIdeaAction = generateRoadmapIdea;
export const updateRoadmapCardColumnAction = updateRoadmapCardColumn;
export const updateRoadmapCardOrderAction = updateRoadmapCardOrder;
export const refineRoadmapCardAction = refineRoadmapCard;
export const updateCardAssigneesAction = updateCardAssignees;
export const conductSuperAgentAction = conductSuperAgent;
export const runMemberSync = syncAllMembers;
export const seedPlatformData = seedPlatformDataFlow;
export const translateTextAction = translateText;
export const updateCommunityRoadmapCardColumnAction = updateCommunityRoadmapCardColumn;
export const generateDualStoryAction = generateDualStory;
export const generateStoryAction = generateStory;
export const translateStoryAction = translateStory;
export const generateSpeechAction = generateSpeech;
export const declareAssetWithFileAction = declareAssetWithFile;
export const createHistorySnapshot = createHistorySnapshotFlow;
export const addRoadmapCardAction = addRoadmapCardFlow;
export const deleteRoadmapCardAction = deleteRoadmapCardFlow;
export const generateProfileAvatarsAction = generateProfileAvatars;
export const analyzeAcademicLevelAction = analyzeAcademicLevel;
export const analyzeStudiesAndBoostCommunityAction = analyzeStudiesAndBoostCommunityTool;
export const echoThoughtFormAction = echoThoughtFormFlow;
