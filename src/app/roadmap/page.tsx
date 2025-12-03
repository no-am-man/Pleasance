
// src/app/roadmap/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KanbanIcon } from '@/components/icons/kanban-icon';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type KanbanCardProps = {
  title: string;
  description: string;
  tags?: string[];
  assignees?: string[];
};

const KanbanCard = ({ title, description, tags, assignees }: KanbanCardProps) => (
  <Card className="bg-card/70 hover:bg-card transition-all cursor-pointer">
    <CardHeader className="p-4">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {tags?.map(tag => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
        <div className="flex -space-x-2">
          <TooltipProvider>
            {assignees?.map(assignee => (
              <Tooltip key={assignee}>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${assignee}`} />
                    <AvatarFallback>{assignee.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{assignee}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </CardContent>
  </Card>
);

const KanbanColumn = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-4">
    <div className="px-3 py-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <div className="flex-grow space-y-4 rounded-lg p-3 bg-muted/50">
      {children}
    </div>
  </div>
);

// Sample Data
const ideasCards: KanbanCardProps[] = [
  { title: "Gamify Language Learning", description: "Add points, streaks, and leaderboards to Nuncy Lingua.", tags: ["Nuncy Lingua", "UX"] },
  { title: "Decentralized Identity", description: "Explore using DIDs for user profiles.", tags: ["Identity", "Web3"] },
];

const nextUpCards: KanbanCardProps[] = [
  { title: "Dynamic Kanban Board", description: "Connect this roadmap to Firestore for real-time updates.", tags: ["Roadmap", "Backend"], assignees: ["Gemini"] },
  { title: "Community Moderation Tools", description: "Allow community owners to manage posts and members.", tags: ["Community"], assignees: ["Noam"] },
];

const inProgressCards: KanbanCardProps[] = [
  { title: "Fabrication Ticketing System", description: "Build the UI and backend for managing fabrication orders.", tags: ["Fabrication"], assignees: ["Noam", "Gemini"] },
];

const aliveCards: KanbanCardProps[] = [
  { title: "Collaborative AI Workshop", description: "A real-time, shared space for generative AI experimentation.", tags: ["Workshop", "AI"], assignees: ["Gemini"] },
  { title: "Community Federation", description: "Create and manage your own sovereign communities.", tags: ["Community"], assignees: ["Noam"] },
  { title: "Nuncy Lingua Story Generator", description: "AI-powered story and speech generation for language learning.", tags: ["Nuncy Lingua"], assignees: ["Gemini"] },
];


export default function RoadmapPage() {
  return (
    <main className="container mx-auto min-h-screen py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <KanbanIcon className="w-10 h-10" /> Federation Roadmap
        </h1>
        <p className="text-lg text-muted-foreground mt-2">The public development plan for the Pleasance project.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        <KanbanColumn title="💡 Ideas">
          {ideasCards.map(card => <KanbanCard key={card.title} {...card} />)}
        </KanbanColumn>
        <KanbanColumn title="🚀 Next Up!">
          {nextUpCards.map(card => <KanbanCard key={card.title} {...card} />)}
        </KanbanColumn>
        <KanbanColumn title="🏗️ In Progress">
          {inProgressCards.map(card => <KanbanCard key={card.title} {...card} />)}
        </KanbanColumn>
        <KanbanColumn title="✅ Alive">
          {aliveCards.map(card => <KanbanCard key={card.title} {...card} />)}
        </KanbanColumn>
      </div>
    </main>
  );
}
