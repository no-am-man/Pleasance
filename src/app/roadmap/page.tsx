// src/app/roadmap/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KanbanIcon } from '@/components/icons/kanban-icon';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { firestore } from '@/firebase/config';
import { collection, query, getDocs } from 'firebase/firestore';
import type { RoadmapCard as RoadmapCardType, RoadmapColumn as RoadmapColumnType, CommunityProfile } from '@/lib/types';
import { GripVertical, LoaderCircle, PlusCircle, Trash2, Sparkles, ArrowLeft, ArrowRight, UserPlus, Check } from 'lucide-react';
import { addRoadmapCard, deleteRoadmapCard, refineCardDescription, updateRoadmapCardAssignees, updateRoadmapCardColumn, updateRoadmapCardOrder, generateRoadmapIdeaAction } from '../actions';
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


const AddIdeaSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long."),
    description: z.string().min(10, "Description must be at least 10 characters long."),
});

const GenerateIdeaSchema = z.object({
    prompt: z.string().min(3, "Prompt must be at least 3 characters long."),
});


function GenerateIdeaForm() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<z.infer<typeof GenerateIdeaSchema>>({
        resolver: zodResolver(GenerateIdeaSchema),
        defaultValues: { prompt: '' },
    });

    async function onSubmit(values: z.infer<typeof GenerateIdeaSchema>) {
        setIsSubmitting(true);
        const result = await generateRoadmapIdeaAction(values);
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Error generating idea',
                description: result.error,
            });
        } else {
            toast({
                title: 'AI Idea Generated!',
                description: `"${result.card?.title}" has been added to the board.`,
            });
            form.reset();
        }
        setIsSubmitting(false);
    }
    
    return (
        <Card className="mb-4 bg-card/70">
            <CardHeader className="p-4">
                <CardTitle className="text-base">Generate New Idea with AI</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="prompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="AI to auto-assign tasks..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" size="sm" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Idea
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

function AddIdeaForm() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    
    const form = useForm<z.infer<typeof AddIdeaSchema>>({
        resolver: zodResolver(AddIdeaSchema),
        defaultValues: { title: '', description: '' },
    });

    async function onSubmit(values: z.infer<typeof AddIdeaSchema>) {
        setIsSubmitting(true);
        const result = await addRoadmapCard(values);
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Error adding idea',
                description: result.error,
            });
        } else {
            toast({
                title: 'Idea Added!',
                description: 'Your new idea has been added to the board.',
            });
            form.reset();
        }
        setIsSubmitting(false);
    }

    const handleRefineDescription = async () => {
        const title = form.getValues('title');
        if (!title) {
            toast({
                variant: 'destructive',
                title: 'Title is required',
                description: 'Please enter a title before refining with AI.',
            });
            return;
        }
        setIsRefining(true);
        const result = await refineCardDescription({ title, description: form.getValues('description') });
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'AI Refinement Failed',
                description: result.error,
            });
        } else if (result.refinedDescription) {
            form.setValue('description', result.refinedDescription, { shouldValidate: true });
        }
        setIsRefining(false);
    }
    
    return (
        <Card className="mb-4 bg-card/70">
            <CardHeader className="p-4">
                <CardTitle className="text-base">Add a New Idea Manually</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="Idea title..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="relative">
                                        <FormControl>
                                            <Textarea placeholder="Refine Description with AI" {...field} className="pr-10"/>
                                        </FormControl>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="absolute top-1 right-1 h-8 w-8"
                                                        onClick={handleRefineDescription}
                                                        disabled={isRefining}
                                                    >
                                                        {isRefining ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4 text-primary" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Refine with AI</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" size="sm" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <LoaderCircle className="animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Add Idea
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

function KanbanCard({ card, columnId, onMove, allProfiles, onUpdateAssignees, dragHandleProps }: { card: RoadmapCardType; columnId: string; onMove: (cardId: string, oldColumnId: string, direction: 'left' | 'right') => void; allProfiles: CommunityProfile[]; onUpdateAssignees: (cardId: string, assigneeName: string, shouldAssign: boolean) => void; dragHandleProps?: {listeners: SyntheticListenerMap, attributes: DraggableAttributes} }) {
  const { user } = useUser();
  const isFounder = user?.email === 'gg.el0ai.com@gmail.com';
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
            {isFounder && (
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
             {isFounder && (
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

function SortableKanbanCard({ card, columnId, onMove, allProfiles, onUpdateAssignees }: { card: RoadmapCardType; columnId: string; onMove: (cardId: string, oldColumnId: string, direction: 'left' | 'right') => void; allProfiles: CommunityProfile[]; onUpdateAssignees: (cardId: string, assigneeName: string, shouldAssign: boolean) => void; }) {
    const isDraggable = columnId === 'ideas';
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
                dragHandleProps={isDraggable ? {listeners, attributes} : undefined}
            />
        </div>
    )
}

function KanbanColumn({ id, title, cards, children, onMoveCard, allProfiles, onUpdateAssignees }: RoadmapColumnType & { children?: React.ReactNode; onMoveCard: (cardId: string, oldColumnId: string, direction: 'left' | 'right') => void; allProfiles: CommunityProfile[]; onUpdateAssignees: (cardId: string, columnId: string, assigneeName: string, shouldAssign: boolean) => void; }) {
  const { user } = useUser();
  const isFounder = user?.email === 'gg.el0ai.com@gmail.com';
  
  const columnDescriptions: { [key: string]: string } = {
    ideas: "A seed of inspiration; a potential future for the republic.",
    nextUp: "The forge is being prepared. These ideas are slated for manifestation.",
    inProgress: "Actively being constructed in the workshop. Viewable on the staging server.",
    alive: "A living part of the republic, actively serving its citizens.",
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
                    {cards.map(card => <SortableKanbanCard key={card.id} card={card} columnId={id} onMove={onMoveCard} allProfiles={allProfiles} onUpdateAssignees={(cardId, assignee, shouldAssign) => onUpdateAssignees(cardId, id, assignee, shouldAssign)} />)}
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


export default function RoadmapPage() {
  const { user } = useUser();
  const isFounder = user?.email === 'gg.el0ai.com@gmail.com';
  const { toast } = useToast();
  
  const [columnsData, setColumnsData] = useState<RoadmapColumnType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) return;
    const fetchRoadmap = async () => {
        try {
            const roadmapQuery = query(collection(firestore, 'roadmap'));
            const snapshot = await getDocs(roadmapQuery);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoadmapColumnType));
            setColumnsData(data);
        } catch (err: any) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };
    fetchRoadmap();
  }, []);

  const [allProfiles, setAllProfiles] = useState<CommunityProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    const fetchProfiles = async () => {
        try {
            const allProfilesQuery = query(collection(firestore, 'community-profiles'));
            const snapshot = await getDocs(allProfilesQuery);
            const data = snapshot.docs.map(doc => doc.data() as CommunityProfile);
            setAllProfiles(data);
        } catch (err: any) {
            // Silently fail on profiles
        } finally {
            setProfilesLoading(false);
        }
    };
    fetchProfiles();
  }, []);

  const [columns, setColumns] = useState<RoadmapColumnType[]>([]);
  const columnOrder = useMemo(() => ['ideas', 'nextUp', 'inProgress', 'alive'], []);

  useEffect(() => {
    if (columnsData) {
      const sortedColumns = [...columnsData].sort((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id));
      setColumns(sortedColumns);
    }
  }, [columnsData, columnOrder]);


  const handleMoveCard = async (cardId: string, oldColumnId: string, direction: 'left' | 'right') => {
    if (!isFounder) {
        toast({ variant: 'destructive', title: 'Permission Denied' });
        return;
    }

    const sourceColumnIndex = columns.findIndex(c => c.id === oldColumnId);
    if (sourceColumnIndex === -1) return;
    
    const targetColumnIndex = direction === 'right' ? sourceColumnIndex + 1 : sourceColumnIndex - 1;
    if (targetColumnIndex < 0 || targetColumnIndex >= columns.length) return;

    const sourceColumn = columns[sourceColumnIndex];
    const targetColumn = columns[targetColumnIndex];
    const cardToMove = sourceColumn.cards.find(c => c.id === cardId);

    if (!cardToMove) return;
    
    // Optimistic UI update
    setColumns(prev => {
        const newColumns = prev.map(c => ({...c, cards: [...c.cards]}));
        const currentSourceCol = newColumns.find(c => c.id === oldColumnId);
        const currentTargetCol = newColumns.find(c => c.id === targetColumn.id);

        if (currentSourceCol && currentTargetCol) {
            currentSourceCol.cards = currentSourceCol.cards.filter(c => c.id !== cardId);
            currentTargetCol.cards.unshift(cardToMove); // Add to the top of the new column
        }
        
        return newColumns;
    });

    const result = await updateRoadmapCardColumn(cardId, sourceColumn.id, targetColumn.id);
    if (result.error) {
        toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
        // Revert UI on failure
        setColumns(columnsData ? [...columnsData].sort((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id)) : []);
    } else {
        toast({ title: 'Card Moved!', description: 'Plan has been updated.' });
    }
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeContainerId = active.data.current?.sortable.containerId;
    const overContainerId = over.data.current?.sortable.containerId;
    
    let reorderedCards: RoadmapCardType[] | undefined;

    if (activeContainerId === overContainerId && activeContainerId === 'ideas') {
      // Reordering within the 'ideas' column
      setColumns(prevColumns => {
        const ideasColumnIndex = prevColumns.findIndex(col => col.id === 'ideas');
        if (ideasColumnIndex === -1) return prevColumns;

        const ideasColumn = prevColumns[ideasColumnIndex];
        const oldIndex = ideasColumn.cards.findIndex(card => card.id === active.id);
        const newIndex = ideasColumn.cards.findIndex(card => card.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return prevColumns;
        
        reorderedCards = arrayMove(ideasColumn.cards, oldIndex, newIndex);
        
        const newColumns = [...prevColumns];
        newColumns[ideasColumnIndex] = { ...ideasColumn, cards: reorderedCards };

        return newColumns;
      });

    } else {
      // Moving between columns
      const sourceColumn = columns.find(col => col.id === activeContainerId);
      const targetColumn = columns.find(col => col.id === overContainerId);

      if (sourceColumn && targetColumn && sourceColumn.id !== targetColumn.id) {
         // For now, only handle with move buttons to avoid complex drag-and-drop state logic between columns
      }
    }
    
    // If reordered, call server action
    if (reorderedCards) {
      const result = await updateRoadmapCardOrder('ideas', reorderedCards);
      if (result.error) {
        toast({ variant: 'destructive', title: 'Reorder Failed', description: result.error });
        // Revert UI on failure by re-fetching or rolling back state
        setColumns(columnsData ? [...columnsData].sort((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id)) : []);
      }
    }
  };

  const handleUpdateAssignees = async (cardId: string, columnId: string, assigneeName: string, shouldAssign: boolean) => {
     // Optimistic UI update
    setColumns(prev => {
        const newColumns = prev.map(c => ({...c, cards: c.cards.map(card => ({...card, assignees: [...(card.assignees || [])]}))}));
        const column = newColumns.find(c => c.id === columnId);
        if (!column) return prev;
        const card = column.cards.find(c => c.id === cardId);
        if (!card) return prev;

        if (shouldAssign) {
            if (!card.assignees?.includes(assigneeName)) {
                card.assignees = [...(card.assignees || []), assigneeName];
            }
        } else {
            card.assignees = (card.assignees || []).filter(name => name !== assigneeName);
        }
        return newColumns;
    });
    
    const result = await updateRoadmapCardAssignees({ columnId, cardId, assigneeName, shouldAssign });
    
    if (result.error) {
        toast({ variant: 'destructive', title: 'Assignment Failed', description: result.error });
        // Revert UI on failure
        setColumns(columnsData ? [...columnsData].sort((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id)) : []);
    } else {
        toast({ title: shouldAssign ? 'User Assigned' : 'User Unassigned' });
    }
  }

  return (
    <main className="container mx-auto min-h-screen py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3 font-headline">
          <KanbanIcon className="w-10 h-10" /> Project Roadmap
        </h1>
        <p className="text-lg text-muted-foreground mt-2">The public development plan for the Pleasance project.</p>
      </div>

      {(isLoading || profilesLoading) && (
          <div className="flex justify-center items-center h-64">
              <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
          </div>
      )}
      
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
      
      {!isLoading && !profilesLoading && !error && (
         <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                {columns && columns.length > 0 ? (
                    columns.map(col => (
                    <KanbanColumn 
                        key={col.id}
                        {...col}
                        onMoveCard={handleMoveCard}
                        allProfiles={allProfiles || []}
                        onUpdateAssignees={handleUpdateAssignees}
                    >
                        {col.id === 'ideas' && isFounder && (
                            <>
                                <GenerateIdeaForm />
                                <AddIdeaForm />
                            </>
                        )}
                    </KanbanColumn>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground col-span-4">Could not load the Project Roadmap.</p>
                )}
            </div>
         </DndContext>
      )}
    </main>
  );
}
