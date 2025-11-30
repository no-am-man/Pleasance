export type Member = {
  id: string;
  name: string;
  role: 'Founder' | 'Moderator' | 'Member';
  avatarUrl: string;
};

type CommunityData = {
  name: string;
  description: string;
  welcomeMessage: string;
  members: Member[];
};

export const COMMUNITY_DATA: CommunityData = {
  name: "The Co-Learners Federation",
  description: "A community for those who believe in the power of learning together.",
  welcomeMessage: "Welcome to our community! We are a federation of learners, builders, and dreamers. This is a space to share knowledge, collaborate on projects, and grow together. We're so glad you're here.",
  members: [
    {
      id: "1",
      name: "Alex",
      role: "Founder",
      avatarUrl: "https://i.pravatar.cc/150?u=alex",
    },
    {
      id: "2",
      name: "Maria",
      role: "Moderator",
      avatarUrl: "https://i.pravatar.cc/150?u=maria",
    },
    {
      id: "3",
      name: "David",
      role: "Member",
      avatarUrl: "https://i.pravatar.cc/150?u=david",
    },
    {
      id: "4",
      name: "Sarah",
      role: "Member",
      avatarUrl: "https://i.pravatar.cc/150?u=sarah",
    },
  ],
};
