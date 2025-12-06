
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
  avatarUrl: z.string().optional(),
  userId: z.string().optional(),
});
export type Member = z.infer<typeof MemberSchema>;

// Schema for the Roadmap Kanban board (Firestore version)
export const RoadmapCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});
export type RoadmapCard = z.infer<typeof RoadmapCardSchema>;

export const GenerateRoadmapIdeaOutputSchema = z.object({
    title: z.string().describe('The concise, action-oriented title for the card.'),
    description: z.string().describe('A detailed description of the feature, explaining the what and why.'),
    tags: z.array(z.string()).describe('An array of 2-3 relevant keywords.'),
});
export type GenerateRoadmapIdeaOutput = z.infer<typeof GenerateRoadmapIdeaOutputSchema>;

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


// Schema for Community
export const CommunitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  ownerId: z.string(),
  members: z.array(MemberSchema),
  flagUrl: z.string().optional(),
  welcomeMessage: z.string(),
});
export type Community = z.infer<typeof CommunitySchema>;

// Schema for Events
export const EventSchema = z.object({
  id: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  date: z.date(),
  location: z.string().min(2, "Location is required."),
  organizerId: z.string(),
  organizerName: z.string(),
  attendees: z.array(z.string()),
  communityId: z.string().optional(),
});
export type Event = z.infer<typeof EventSchema>;

// LinguaTune Story Schema
export const DualLanguageStorySchema = z.object({
  titleOriginal: z.string().describe("The title of the story in the target language"),
  titleTranslated: z.string().describe("The English translation of the title"),
  contentOriginal: z.string().describe("The full story text in the target language"),
  contentTranslated: z.string().describe("The full story text translated into English"),
  vocabulary: z.array(z.object({
    word: z.string(),
    translation: z.string(),
    context: z.string().describe("How this word was used in the story")
  })).describe("5-7 key vocabulary words from the story")
});
export type DualLanguageStory = z.infer<typeof DualLanguageStorySchema>;

// This is the Firestore representation of the story.
export const StorySchema = z.object({
    id: z.string(),
    userId: z.string(),
    level: z.string(),
    sourceLanguage: z.string(),
    targetLanguage: z.string(),
    nativeText: z.string(),
    translatedText: z.string(),
    audioUrl: z.string().optional(),
    createdAt: z.any(),
    status: z.enum(['processing', 'complete', 'failed']),
});
export type Story = z.infer<typeof StorySchema>;


// Schema for "Forms" (Bubbles in CCN)
export const FormSchema = z.object({
    id: z.string(),
    communityId: z.string(),
    originCommunityId: z.string(),
    userId: z.string(),
    userName: z.string(),
    userAvatarUrl: z.string().optional(),
    type: z.literal('text'),
    text: z.string().optional().nullable(),
    createdAt: z.any(),
    status: z.enum(['active', 'done']),
    deleted: z.boolean().optional(),
    deletedAt: z.any().optional(),
    audience: z.enum(['public', 'owner']).optional(),
});
export type Form = z.infer<typeof FormSchema>;

export const JoinRequestSchema = z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    userBio: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']),
    createdAt: z.any().optional(),
});
export type JoinRequest = z.infer<typeof JoinRequestSchema>;

export const CreationSchema = z.object({
    id: z.string(),
    creatorId: z.string(),
    creatorName: z.string(),
    creatorAvatarUrl: z.string(),
    prompt: z.string(),
    status: z.enum(['in-workshop', 'published']),
    createdAt: z.any(),
    pixels: z.array(ColorPixelSchema),
});
export type Creation = z.infer<typeof CreationSchema>;

// Schema for Presence
export const PresenceSchema = z.object({
    userId: z.string(),
    userName: z.string(),
    avatarUrl: z.string(),
    lastSeen: z.any(),
});
export type Presence = z.infer<typeof PresenceSchema>;
