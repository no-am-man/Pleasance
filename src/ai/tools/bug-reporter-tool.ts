'use server';
/**
 * @fileOverview A Genkit tool for reporting bugs.
 * 
 * - addBugReportTool - The tool function for adding a bug report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, serverTimestamp } from 'firebase-admin/firestore';

const AddBugReportInputSchema = z.object({
  title: z.string().describe('The title of the bug report.'),
  description: z.string().describe('A detailed description of the bug.'),
  priority: z.enum(['low', 'medium', 'high']).describe('The priority of the bug report.'),
  reporterId: z.string().describe("The UID of the user reporting the bug."),
  reporterName: z.string().describe("The name of the user reporting the bug."),
});

const AddBugReportOutputSchema = z.object({
  bugId: z.string().describe('The ID of the newly created bug report.'),
  status: z.string().describe('The status of the operation.'),
});

export const addBugReportTool = ai.defineTool(
  {
    name: 'addBugReport',
    description: 'Creates a new bug report in the system. Use this when a user wants to report a problem or issue.',
    inputSchema: AddBugReportInputSchema,
    outputSchema: AddBugReportOutputSchema,
  },
  async (input) => {
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);
    const newBugRef = firestore.collection('bugs').doc();

    const newBug = {
      id: newBugRef.id,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: 'new' as const,
      reporterId: input.reporterId,
      reporterName: input.reporterName,
      createdAt: serverTimestamp(),
    };

    await newBugRef.set(newBug);

    return { bugId: newBugRef.id, status: "Bug report created successfully." };
  }
);
