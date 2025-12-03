// src/app/roadmap/page.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KanbanIcon } from '@/components/icons/kanban-icon';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { database } from '@/firebase/config';
import { ref } from 'firebase/database';
import { useObjectVal } from 'react-firebase-hooks/database';
import type { RoadmapCard as RoadmapCardType, RoadmapData } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';

const KanbanCard = ({ title, description, tags, assignees }: RoadmapCardType) => (
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

const KanbanColumn = ({ title, cards }: { title: string, cards: RoadmapCardType[] | undefined }) => (
  <div className="flex flex-col gap-4">
    <div className="px-3 py-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <div className="flex-grow space-y-4 rounded-lg p-3 bg-muted/50 min-h-[200px]">
      {cards ? (
        cards.map(card => <KanbanCard key={card.id} {...card} />)
      ) : (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No cards in this column.</p>
        </div>
      )}
    </div>
  </div>
);

export default function RoadmapPage() {
  const roadmapRef = useMemo(() => ref(database, 'roadmap/cards'), []);
  const [roadmapData, isLoading, error] = useObjectVal<RoadmapData>(roadmapRef);

  const getCardsForColumn = (column: keyof RoadmapData) => {
    if (!roadmapData || !roadmapData[column]) return [];
    return Object.values(roadmapData[column]);
  };

  return (
    <main className="container mx-auto min-h-screen py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <KanbanIcon className="w-10 h-10" /> Federation Roadmap
        </h1>
        <p className="text-lg text-muted-foreground mt-2">The public development plan for the Pleasance project.</p>
      </div>

      {isLoading && (
          <div className="flex justify-center items-center h-64">
              <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
          </div>
      )}
      
      {error && (
        <Card className="max-w-md mx-auto bg-destructive/20 border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Failed to Load Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive/80">There was an error connecting to the database.</p>
                <pre className="text-xs mt-2">{error.message}</pre>
            </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            <KanbanColumn title="💡 Ideas" cards={getCardsForColumn('ideas')} />
            <KanbanColumn title="🚀 Next Up!" cards={getCardsForColumn('nextUp')} />
            <KanbanColumn title="🏗️ In Progress" cards={getCardsForColumn('inProgress')} />
            <KanbanColumn title="✅ Alive" cards={getCardsForColumn('alive')} />
        </div>
      )}
    </main>
  );
}
