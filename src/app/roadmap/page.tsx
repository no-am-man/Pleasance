// src/app/roadmap/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KanbanIcon } from '@/components/icons/kanban-icon';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { firestore } from '@/firebase/config';
import { collection, query } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import type { RoadmapCard as RoadmapCardType, RoadmapColumn as RoadmapColumnType } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateRoadmapCardColumn } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

const SortableKanbanCard = ({ id, title, description, tags, assignees }: RoadmapCardType) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="bg-card/70 hover:bg-card transition-all cursor-grab active:cursor-grabbing">
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
    </div>
  );
}

const KanbanColumn = ({ id, title, cards }: RoadmapColumnType) => (
  <div className="flex flex-col gap-4">
    <div className="px-3 py-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <div className="flex-grow space-y-4 rounded-lg p-3 bg-muted/50 min-h-[200px]">
      <SortableContext id={id} items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        {cards && cards.length > 0 ? (
          cards.map(card => <SortableKanbanCard key={card.id} {...card} />)
        ) : (
          <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No cards in this column.</p>
          </div>
        )}
      </SortableContext>
    </div>
  </div>
);

export default function RoadmapPage() {
  const { user } = useUser();
  const isFounder = user?.email === 'gg.el0ai.com@gmail.com';
  const { toast } = useToast();
  const roadmapQuery = useMemo(() => query(collection(firestore, 'roadmap')), []);
  const [columnsData, isLoading, error] = useCollectionData<RoadmapColumnType>(roadmapQuery);

  const [columns, setColumns] = useState<RoadmapColumnType[]>([]);

  useEffect(() => {
    if (columnsData) {
      const order = ['ideas', 'nextUp', 'inProgress', 'alive'];
      const sortedColumns = [...columnsData].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      setColumns(sortedColumns);
    }
  }, [columnsData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    if (!isFounder) {
        toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'Only the founder can modify the roadmap.',
        });
        return;
    }
    
    const activeColumn = columns.find(col => col.cards.some(c => c.id === active.id));
    const overColumn = columns.find(col => col.id === over.id || col.cards.some(c => c.id === over.id));

    if (!activeColumn || !overColumn) return;

    // Optimistically update UI
    setColumns(prevColumns => {
      const activeItems = activeColumn.cards;
      const overItems = overColumn.cards;
      const activeIndex = activeItems.findIndex(c => c.id === active.id);
      
      let newColumns = [...prevColumns];

      if (activeColumn.id === overColumn.id) {
        // Moving within the same column
        const newCards = arrayMove(activeItems, activeIndex, overItems.findIndex(c => c.id === over.id));
        const columnIndex = newColumns.findIndex(c => c.id === activeColumn.id);
        newColumns[columnIndex] = { ...newColumns[columnIndex], cards: newCards };
      } else {
        // Moving to a different column
        const [movedCard] = activeItems.splice(activeIndex, 1);
        
        const overIndex = over.data.current?.sortable?.index ?? overItems.length;
        overItems.splice(overIndex, 0, movedCard);

        const activeColumnIndex = newColumns.findIndex(c => c.id === activeColumn.id);
        const overColumnIndex = newColumns.findIndex(c => c.id === overColumn.id);
        
        newColumns[activeColumnIndex] = { ...newColumns[activeColumnIndex], cards: activeItems };
        newColumns[overColumnIndex] = { ...newColumns[overColumnIndex], cards: overItems };
      }
      return newColumns;
    });

    // Update Firestore
    const result = await updateRoadmapCardColumn(active.id as string, activeColumn.id, overColumn.id);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
      // Optionally revert state, though useCollectionData will handle it
    } else {
       toast({
        title: 'Roadmap Updated',
        description: 'Card position has been saved.',
      });
    }
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
         <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {columns.map(column => (
                    <KanbanColumn key={column.id} {...column} />
                ))}
            </div>
         </DndContext>
      )}
    </main>
  );
}
