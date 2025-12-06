
'use server';
/**
 * @fileOverview A flow to generate a community based on a user prompt, including AI members.
 *
 * - generateCommunity - A function that generates community details and members.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCommunityInputSchema = z.object({
  prompt: z
    .string()
    .describe('A user-provided prompt describing the desired community.'),
  includeAiAgents: z.boolean().describe('Whether or not to generate AI agents for the community.'),
});
type GenerateCommunityInput = z.infer<typeof GenerateCommunityInputSchema>;

const MemberSchema = z.object({
    name: z.string().describe("The AI member's unique name."),
    role: z.string().describe("The member's role in the community (e.g., 'Guide', 'Archivist', 'Explorer')."),
    bio: z.string().describe("A short, one-sentence bio describing the member's personality and purpose."),
    type: z.enum(['AI']).describe('The type of member, which is always AI for generated members.'),
  });
  
const GenerateCommunityOutputSchema = z.object({
  name: z.string().describe("A concise and catchy name for the community (e.g., 'Cosmic Coders')."),
  description: z.string().describe("A one-sentence description of the community's purpose."),
  welcomeMessage: z.string().describe("A warm, one-paragraph welcome message for new members."),
  members: z.array(MemberSchema).describe('A list of 3-5 unique, AI-generated members for the community.'),
});

export async function generateCommunity(input: GenerateCommunityInput): Promise<z.infer<typeof GenerateCommunityOutputSchema>> {
  return generateCommunityFlow(input);
}

const generateCommunityPrompt = ai.definePrompt({
  name: 'generateCommunityPrompt',
  input: {schema: GenerateCommunityInputSchema},
  output: {schema: GenerateCommunityOutputSchema},
  config: {
    model: 'googleai/gemini-1.5-flash',
  },
  prompt: `You are an expert at founding online communities. Based on the user's prompt, generate a name, a short description, and a welcome message.

Your first member must ALWAYS be a special 'Concierge' agent.
- Name: Concierge
- Role: SuperAgent
- Bio: I am the Concierge, here to welcome new members and help them get acquainted with our community.
- Type: AI

{{#if includeAiAgents}}
You must also generate a diverse cast of 2-4 additional AI members to populate the community. Each member must have a unique name, role, a one-sentence bio that reflects the community's theme, and the 'type' field must be set to 'AI'.
{{else}}
You must NOT generate any other AI members. The 'members' array in your output must contain only the Concierge.
{{/if}}

User Prompt: {{{prompt}}}

Generate a response that is creative, inviting, and directly related to the user's prompt.`,
});

const generateCommunityFlow = ai.defineFlow(
  {
    name: 'generateCommunityFlow',
    inputSchema: GenerateCommunityInputSchema,
    outputSchema: GenerateCommunityOutputSchema,
  },
  async input => {
    const {output} = await generateCommunityPrompt(input);
    return output!;
  }
);
