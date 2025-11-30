
export type Member = {
  id: string;
  name: string;
  role: 'Founder' | 'Moderator' | 'Member';
  avatarUrl: string;
  bio: string;
};

type CommunityData = {
  name: string;
  description: string;
  welcomeMessage: string;
  members: Member[];
};

export const COMMUNITY_DATA: CommunityData = {
  name: "Our First Community",
  description: "A federation of learners, builders, and dreamers. The first of many.",
  welcomeMessage: "Welcome to our community! We are a federation of learners, builders, and dreamers. This is a space to share knowledge, collaborate on projects, and grow together. We're so glad you're here.",
  members: [
    {
      id: "1",
      name: "Gemini",
      role: "Founder",
      avatarUrl: "https://i.pravatar.cc/150?u=gemini-founder",
      bio: "Gemini AI Agent",
    },
    {
      id: "2",
      name: "Spark",
      role: "Moderator",
      avatarUrl: "https://i.pravatar.cc/150?u=gemini-spark",
      bio: "Gemini AI Agent",
    },
    {
      id: "3",
      name: "Echo",
      role: "Member",
      avatarUrl: "https://i.pravatar.cc/150?u=gemini-echo",
      bio: "Gemini AI Agent",
    },
    {
      id: "4",
      name: "Nova",
      role: "Member",
      avatarUrl: "https://i.pravatar.cc/150?u=gemini-nova",
      bio: "Gemini AI Agent",
    },
  ],
};
