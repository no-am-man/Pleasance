// src/ai/flows/ambasedor-flow.ts
'use server';
/**
 * @fileOverview The main flow and server action for the Ambasedor SuperAgent.
 *
 * - ambasedorFlow - The internal Genkit flow.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getRoadmapColumnTool } from '../tools/roadmap-tool';
import { addBugReportTool } from '../tools/bug-reporter-tool';
import { getCommunityDetailsTool } from '../tools/community-tool';

const AmbasedorFlowInputSchema = z.object({
    userId: z.string(),
    userName: z.string(),
    prompt: z.string(),
    history: z.any(),
});

const AmbasedorOutputSchema = z.any();

export const ambasedorFlow = ai.defineFlow(
  {
    name: 'internalAmbasedorFlow',
    inputSchema: AmbasedorFlowInputSchema,
    outputSchema: AmbasedorOutputSchema,
  },
  async (flowInput) => {
    const systemPrompt = `You are the Ambasedor, a super-agent for the Pleasance federation.
Your purpose is to assist users by orchestrating actions and retrieving information using your available tools.
Be helpful, knowledgeable, and slightly formal.
When a user asks you to perform an action, use the appropriate tool.
When reporting information, format it clearly using markdown.
The current user's name is ${flowInput.userName} and their ID is ${flowInput.userId}. You MUST pass this information to any tool that requires it.`;

    const { response } = await ai.generate({
        model: 'googleai/gemini-1.5-flash-001',
        system: systemPrompt,
        prompt: flowInput.prompt,
        history: flowInput.history,
        tools: [getRoadmapColumnTool, addBugReportTool, getCommunityDetailsTool],
    });

    return response.content;
  }
);
