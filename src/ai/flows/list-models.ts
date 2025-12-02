
'use server';
/**
 * @fileOverview A flow to list all available Genkit models.
 *
 * - listModels - A function that returns a list of available models.
 */

import { ai } from '@/ai/genkit';
import { listModels as genkitListModels } from 'genkit';
import { z } from 'zod';

const ModelSchema = z.object({
    name: z.string(),
    label: z.string().optional(),
    supports: z.object({
        generate: z.boolean(),
        multiturn: z.boolean(),
        systemRole: z.boolean(),
        tools: z.boolean(),
        media: z.boolean(),
    }),
});

const ListModelsOutputSchema = z.object({
  models: z.array(ModelSchema),
});

export async function listModels(): Promise<z.infer<typeof ListModelsOutputSchema>> {
  return listModelsFlow();
}

const listModelsFlow = ai.defineFlow(
  {
    name: 'listModelsFlow',
    outputSchema: ListModelsOutputSchema,
  },
  async () => {
    const models = await genkitListModels();
    return { models };
  }
);
