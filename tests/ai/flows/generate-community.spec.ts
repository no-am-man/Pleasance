// tests/ai/flows/generate-community.spec.ts
import { test, expect, describe } from 'vitest';
import { generateCommunity } from '@/ai/flows/generate-community';
import { z } from 'zod';

const MemberSchema = z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    type: z.enum(['AI']),
});
  
const GenerateCommunityOutputSchema = z.object({
  name: z.string(),
  description: z.string(),
  welcomeMessage: z.string(),
  members: z.array(MemberSchema),
});

describe('generateCommunity flow', () => {

  test('should generate a community with AI agents', async () => {
    const input = {
      prompt: 'A group of stoic philosophers discussing modern problems.',
      includeAiAgents: true,
    };

    const result = await generateCommunity(input);
    
    const validation = GenerateCommunityOutputSchema.safeParse(result);
    expect(validation.success, 'Output should match Zod schema').toBe(true);
    
    if (validation.success) {
        expect(validation.data.name.length).toBeGreaterThan(5);
        expect(validation.data.description.length).toBeGreaterThan(10);
        expect(validation.data.welcomeMessage.length).toBeGreaterThan(20);
        
        // Check for the mandatory Concierge agent
        const concierge = validation.data.members.find(m => m.name === 'Concierge');
        expect(concierge).toBeDefined();
        expect(concierge?.role).toBe('SuperAgent');
        
        // Check that there are other AI agents as requested
        expect(validation.data.members.length).toBeGreaterThan(1);
    }

  }, 45000);

  test('should generate a community without extra AI agents', async () => {
    const input = {
      prompt: 'A solo writer\'s guild for journaling.',
      includeAiAgents: false,
    };

    const result = await generateCommunity(input);
    
    const validation = GenerateCommunityOutputSchema.safeParse(result);
    expect(validation.success, 'Output should match Zod schema').toBe(true);

    if (validation.success) {
        // The only member should be the Concierge
        expect(validation.data.members.length).toBe(1);
        expect(validation.data.members[0].name).toBe('Concierge');
    }
  }, 45000);

});
