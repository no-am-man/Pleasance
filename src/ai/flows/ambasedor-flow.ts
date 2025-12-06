
'use server';
/**
 * @fileOverview The main flow for the Ambasedor SuperAgent.
 *
 * - ambasedorFlow - The primary function that orchestrates AI responses and tool usage.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getRoadmapColumnTool } from '../tools/roadmap-tool';
import { addBugReportTool } from '../tools/bug-reporter-tool';
import { getCommunityDetailsTool } from '../tools/community-tool';

const AmbasedorInputSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  prompt: z.string(),
});

// Using z.any() for output as the structure can be complex (text, tool_request, etc.)
const AmbasedorOutputSchema = z.any();

export async function ambasedorFlow(input: z.infer<typeof AmbasedorInputSchema>): Promise<any> {
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);
    const ambasedorDocRef = firestore.collection('ambasedor').doc(input.userId);
    
    // Read the document to get the history
    const ambasedorDoc = await ambasedorDocRef.get();
    
    // Ensure the document exists before trying to read from it
    if (!ambasedorDoc.exists) {
        await ambasedorDocRef.set({ history: [] });
    }
    const history = ambasedorDoc.exists ? ambasedorDoc.data()?.history || [] : [];
    
    const systemPrompt = `You are the Ambasedor, a super-agent for the Pleasance federation.
Your purpose is to assist users by orchestrating actions and retrieving information using your available tools.
Be helpful, knowledgeable, and slightly formal.
When a user asks you to perform an action, use the appropriate tool.
When reporting information, format it clearly using markdown.
The current user's name is ${input.userName} and their ID is ${input.userId}. You MUST pass this information to any tool that requires it.`;

    const { response } = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        system: systemPrompt,
        prompt: input.prompt,
        history,
        tools: [getRoadmapColumnTool, addBugReportTool, getCommunityDetailsTool],
    });

    // The entire response includes the user prompt and the model's reply.
    // We need to add both to the history to maintain context.
    const userMessagePart = { role: 'user', content: [{ text: input.prompt }] };
    const modelResponseParts = response.content;
    
    // Update history correctly.
    await ambasedorDocRef.update({
        history: FieldValue.arrayUnion(userMessagePart, ...modelResponseParts),
    });

    return modelResponseParts;
}
