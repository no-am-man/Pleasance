
// src/app/community/[id]/roadmap/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KanbanIcon } from '@/components/icons/kanban-icon';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { firestore } from '@/firebase/config';
import { collection, query, doc, getDoc } from 'firebase/firestore';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import type { RoadmapCard as RoadmapCardType, RoadmapColumn as RoadmapColumnType, CommunityProfile } from '@/lib/types';
import { GripVertical, LoaderCircle, PlusCircle, Trash2, Sparkles, ArrowLeft, ArrowRight, UserPlus, Check, Database } from 'lucide-react';
import { addRoadmapCard, deleteRoadmapCard, refineCardDescription, updateRoadmapCardAssignees, updateRoadmapCardColumn, updateRoadmapCardOrder, generateRoadmapIdeaAction, seedCommunityRoadmapData } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useUser, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DndContext, closestCenter, type DragEndEvent, type DraggableAttributes } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';


function KanbanCard({ card, columnId, onMove, allProfiles, onUpdateAssignees, isOwner, dragHandleProps }: { card: RoadmapCardType; columnId: string; onMove: (cardId: string, oldColumnId: string, direction: 'left' | 'right') => void; allProfiles: CommunityProfile[]; onUpdateAssignees: (cardId: string, assigneeName: string, shouldAssign: boolean) => void; isOwner: boolean; dragHandleProps?: {listeners: SyntheticListenerMap, attributes: DraggableAttributes} }) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const columnIds = ['ideas', 'nextUp', 'inProgress', 'alive'];
  const currentIndex = columnIds.indexOf(columnId);

  const canMoveLeft = currentIndex > 0;
  const canMoveRight = currentIndex < columnIds.length - 1;

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteRoadmapCard(card.id, columnId);
    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Error deleting idea',
            description: result.error,
        });
    } else {
        toast({
            title: 'Idea Removed',
            description: 'The idea has been removed from the board.',
        });
    }
  };
  
  const stopPropagation = (e: React.MouseEvent | React.FocusEvent) => e.stopPropagation();

  return (
    <Card className="bg-card/70 hover:bg-card transition-all group relative">
      <CardHeader
        className="p-4 pb-0 flex flex-row items-start justify-between"
        {...dragHandleProps?.attributes}
        {...dragHandleProps?.listeners}
      >
        <div className="flex items-center gap-2">
            <div className={cn("p-1 opacity-20 group-hover:opacity-100 transition-opacity", dragHandleProps ? 'cursor-grab' : 'cursor-default')}>
                <GripVertical className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">{card.title}</CardTitle>
        </div>
        <div className="flex items-center">
            {isOwner && (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {canMoveLeft && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onMouseDown={stopPropagation} onClick={() => onMove(card.id, columnId, 'left')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    {canMoveRight && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onMouseDown={stopPropagation} onClick={() => onMove(card.id, columnId, 'right')}>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}
                    {columnId === 'ideas' && (
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onMouseDown={stopPropagation}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onMouseDown={stopPropagation} onFocus={stopPropagation}>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the idea "{card.title}". This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                {isDeleting ? <LoaderCircle className="animate-spin" /> : 'Delete'}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {card.tags?.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
                <TooltipProvider>
                {card.assignees?.map(assigneeName => {
                    const assigneeProfile = allProfiles.find(p => p.name === assigneeName);
                    return (
                        <Tooltip key={assigneeName}>
                            <TooltipTrigger asChild>
                                <Avatar className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={assigneeProfile?.avatarUrl || `https://i.pravatar.cc/150?u=${assigneeName}`} />
                                <AvatarFallback>{assigneeName.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{assigneeName}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
                </TooltipProvider>
            </div>
             {isOwner && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onMouseDown={stopPropagation}>
                            <UserPlus className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onMouseDown={stopPropagation} onFocus={stopPropagation}>
                        {allProfiles.map(profile => {
                            const isAssigned = card.assignees?.includes(profile.name);
                            return (
                                <DropdownMenuItem key={profile.id} onSelect={() => onUpdateAssignees(card.id, profile.name, !isAssigned)}>
                                    <div className={cn("w-4 h-4 mr-2", !isAssigned && "opacity-0")}>
                                        <Check className="h-4 w-4"/>
                                    </div>
                                    <span>{profile.name}</span>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableKanbanCard({ card, columnId, onMove, allProfiles, onUpdateAssignees, isOwner }: { card: RoadmapCardType; columnId: string; onMove: (cardId: string, oldColumnId: string, direction: 'left' | 'right') => void; allProfiles: CommunityProfile[]; onUpdateAssignees: (cardId: string, assigneeName: string, shouldAssign: boolean) => void; isOwner: boolean }) {
    const isDraggable = columnId === 'ideas' && isOwner;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
        id: card.id,
        disabled: !isDraggable,
     });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-50')}>
            <KanbanCard
                card={card}
                columnId={columnId}
                onMove={onMove}
                allProfiles={allProfiles}
                onUpdateAssignees={onUpdateAssignees}
                isOwner={isOwner}
                dragHandleProps={isDraggable ? {listeners, attributes} : undefined}
            />
        </div>
    )
}

function KanbanColumn({ id, title, cards, children, onMoveCard, allProfiles, onUpdateAssignees, isOwner }: RoadmapColumnType & { children?: React.ReactNode; onMoveCard: (cardId: string, oldColumnId: string, direction: 'left' | 'right') => void; allProfiles: CommunityProfile[]; onUpdateAssignees: (cardId: string, columnId: string, assigneeName: string, shouldAssign: boolean) => void; isOwner: boolean }) {
  
  const columnDescriptions: { [key: string]: string } = {
    ideas: "A seed of inspiration; a potential future for the community.",
    nextUp: "The forge is being prepared. These ideas are slated for manifestation.",
    inProgress: "Actively being constructed in the workshop.",
    alive: "A living part of the community, actively serving its members.",
  };
  
  return (
      <div className="flex flex-col gap-4">
        <div className="px-3 py-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{columnDescriptions[id]}</p>
        </div>
        <div className="flex-grow space-y-4 rounded-lg p-3 bg-muted/50 min-h-[200px]">
            {children}
            {cards ? (
                <SortableContext id={id} items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map(card => <SortableKanbanCard key={card.id} card={card} columnId={id} onMove={onMoveCard} allProfiles={allProfiles} onUpdateAssignees={(cardId, assignee, shouldAssign) => onUpdateAssignees(cardId, id, assignee, shouldAssign)} isOwner={isOwner} />)}
                </SortableContext>
            ) : (
              !children && (
                 <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    <p>No cards in this column.</p>
                </div>
              )
            )}
        </div>
      </div>
  );
}


export default function CommunityRoadmapPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const params = useParams();
  const communityId = params.id as string;
  const [isSeeding, setIsSeeding] = useState(false);
  
  const communityDocRef = useMemoFirebase(() => communityId ? doc(firestore, 'communities', communityId) : null, [communityId]);
  const [community, isCommunityLoading] = useDocumentData(communityDocRef);
  const isOwner = user?.uid === community?.ownerId;

  const roadmapQuery = useMemoFirebase(() => communityId ? query(collection(firestore, `communities/${communityId}/roadmap`)) : null, [communityId]);
  const [columnsData, isLoading, error] = useCollectionData<RoadmapColumnType>(roadmapQuery, { idField: 'id' });
  
  const memberProfiles: CommunityProfile[] = useMemo(() => {
    if (!community?.members) return [];
    return community.members
      .filter((m: any) => m.type === 'human')
      .map((m: any) => ({
        id: m.userId,
        name: m.name,
        bio: m.bio,
        avatarUrl: m.avatarUrl,
        // Add other required fields for CommunityProfile, even if empty
        nativeLanguage: '',
        learningLanguage: '',
        userId: m.userId
      }));
  }, [community?.members]);


  const [columns, setColumns] = useState<RoadmapColumnType[]>([]);
  const columnOrder = useMemo(() => ['ideas', 'nextUp', 'inProgress', 'alive'], []);

  useEffect(() => {
    if (columnsData) {
      const sortedColumns = [...columnsData].sort((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id));
      setColumns(sortedColumns);
    }
  }, [columnsData, columnOrder]);


  const handleMoveCard = async (cardId: string, oldColumnId: string, direction: 'left' | 'right') => {
    // This action needs to be modified to write to the community subcollection
    console.log("Moving card - not implemented for community yet");
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    // This action needs to be modified to write to the community subcollection
    console.log("Dragging card - not implemented for community yet");
  };

  const handleUpdateAssignees = async (cardId: string, columnId: string, assigneeName: string, shouldAssign: boolean) => {
    // This action needs to be modified to write to the community subcollection
     console.log("Updating assignees - not implemented for community yet");
  }
  
  const handleSeedData = async () => {
    if (!communityId) return;
    setIsSeeding(true);
    const result = await seedCommunityRoadmapData({ communityId });
    if (result.error) {
      toast({ variant: 'destructive', title: 'Seeding Failed', description: result.error });
    } else {
      toast({ title: 'Roadmap Seeded!', description: 'Your community roadmap is ready.' });
    }
    setIsSeeding(false);
  }

  if (isCommunityLoading || isLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <main className="container mx-auto min-h-screen py-8">
      <div className="mb-6">
        <Button asChild variant="ghost">
            <Link href={`/community/${communityId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {community?.name || 'Community'}
            </Link>
        </Button>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3 font-headline">
          <KanbanIcon className="w-10 h-10" /> {community?.name} Roadmap
        </h1>
        <p className="text-lg text-muted-foreground mt-2">The private development plan for this community.</p>
      </div>
      
      {error && (
        <Card className="max-w-md mx-auto bg-destructive/20 border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Failed to Load Roadmap</CardTitle>
                <CardDescription>There was an error connecting to the data source.</CardDescription>
            </CardHeader>
            <CardContent>
                <pre className="text-xs mt-2">{error.message}</pre>
            </CardContent>
        </Card>
      )}
      
      {!isLoading && !error && (
         <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                {columns && columns.length > 0 ? (
                    columns.map(col => (
                    <KanbanColumn 
                        key={col.id}
                        {...col}
                        onMoveCard={handleMoveCard}
                        allProfiles={memberProfiles}
                        onUpdateAssignees={handleUpdateAssignees}
                        isOwner={isOwner}
                    >
                        {/* Add idea forms would go here if implemented for communities */}
                    </KanbanColumn>
                    ))
                ) : (
                    <div className="col-span-full">
                        <Card className="text-center py-12">
                            <CardHeader>
                                <KanbanIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                                <CardTitle>Your Roadmap is Empty</CardTitle>
                                <CardDescription>Get started by seeding the board with default columns and cards.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isOwner ? (
                                    <Button onClick={handleSeedData} disabled={isSeeding}>
                                        {isSeeding ? <LoaderCircle className="mr-2 animate-spin" /> : <Database className="mr-2"/>}
                                        Seed Roadmap Data
                                    </Button>
                                ) : (
                                    <p className="text-muted-foreground">The community owner can seed the roadmap to get started.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
         </DndContext>
      )}
    </main>
  );
}

