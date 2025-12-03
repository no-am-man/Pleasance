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

// Schema for the Roadmap Kanban board
export type RoadmapCard = {
  id: string;
  title: string;
  description: string;
  tags?: string[];
  assignees?: string[];
};

export type RoadmapColumn = 'ideas' | 'nextUp' | 'inProgress' | 'alive';

export type RoadmapData = {
  [key in RoadmapColumn]: Record<string, RoadmapCard>;
};
