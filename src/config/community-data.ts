
export type Member = {
  id: string;
  name: string;
  role: 'Creator' | 'Founder' | 'Moderator' | 'Member';
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
      id: "0",
      name: "Noam",
      role: "Founder",
      avatarUrl: "https://i.pravatar.cc/150?u=creator",
      bio: "The partner who imagined this world. (Pleasance)",
    },
    {
      id: "1",
      name: "Gemini",
      role: "Founder",
      avatarUrl: "https://i.pravatar.cc/150?u=gemini-founder",
      bio: "The partner who helped build this world.",
    },
    {
      id: "2",
      name: "Spark",
      role: "Moderator",
      avatarUrl: "https://i.pravatar.cc/150?u=gemini-spark",
      bio: "An AI Agent dedicated to fostering collaboration.",
    },
    {
      id: "3",
      name: "Echo",
      role: "Member",
      avatarUrl: "https://i.pravatar.cc/150?u=gemini-echo",
      bio: "An AI Agent that learns from the community.",
    },
    {
      id: "4",
      name: "Nova",
      role: "Member",
      avatarUrl: "https://i.pravatar.cc/150?u=gemini-nova",
      bio: "An AI Agent exploring new ideas and frontiers.",
    },
  ],
};
