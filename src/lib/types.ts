// src/lib/types.ts
import { z } from 'zod';

// Schemas and Types for SVG3D Generation
export const ColorPixelSchema = z.object({
    x: z.number().describe('The X coordinate, from -50 to 50.'),
    y: z.number().describe('The Y coordinate, from -50 to 50.'),
    z: z.number().describe('The Z coordinate, from -50 to 50.'),
    color: z.string().describe('The hexadecimal color code (e.g., "#FF5733").')
});
export type ColorPixel = z.infer<typeof ColorPixelSchema>;

export const GenerateSvg3dInputSchema = z.object({
  prompt: z.string(),
  cubeSize: z.coerce.number(),
  density: z.enum(['low', 'medium', 'high']),
});
export type GenerateSvg3dInput = z.infer<typeof GenerateSvg3dInputSchema>;

// Schema for chat input, as it's used across client and server
export const MemberSchema = z.object({
  name: z.string().describe("The AI member's unique name."),
  role: z.string().describe("The member's role in the community."),
  bio: z.string().describe("A short bio describing the member's personality and purpose."),
  type: z.enum(['AI', 'human']).describe('The type of member.'),
});

// Schema for the Roadmap Kanban board (Firestore version)
export const RoadmapCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});
export type RoadmapCard = z.infer<typeof RoadmapCardSchema>;

export const RoadmapColumnSchema = z.object({
    id: z.string(),
    title: z.string(),
    cards: z.array(RoadmapCardSchema),
});
export type RoadmapColumn = z.infer<typeof RoadmapColumnSchema>;


// Schema for Community Profile
export const CommunityProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  bio: z.string(),
  nativeLanguage: z.string(),
  learningLanguage: z.string(),
  avatarUrl: z.string().optional(),
});
export type CommunityProfile = z.infer<typeof CommunityProfileSchema>;
