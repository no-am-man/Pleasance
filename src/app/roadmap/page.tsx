// src/app/roadmap/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KanbanIcon } from '@/components/icons/kanban-icon';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { firestore } from '@/firebase/config';
import { collection, query } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import type { RoadmapCard as RoadmapCardType, RoadmapColumn as RoadmapColumnType } from '@/lib/types';
import { LoaderCircle, PlusCircle, Trash2, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { updateRoadmapCardColumn, addRoadmapCard, deleteRoadmapCard, refineCardDescription, updateRoadmapCardOrder } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
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
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';


const AddIdeaSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long."),
    description: z.string().min(10, "Description must be at least 10 characters long."),
});

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
                <CardTitle className="text-base">Add a New Idea</CardTitle>
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

function KanbanCard({ card, columnId, onMove }: { card: RoadmapCardType; columnId: string; onMove: (cardId: string, oldColumnId: string, direction: 'left' | 'right') => void; }) {
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
            title: 'Idea Deleted!',
            description: 'The idea has been removed from the board.',
        });
    }
  };

  return (
    <Card className="bg-card/70 hover:bg-card transition-all group relative">
      <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
        <CardTitle className="text-base">{card.title}</CardTitle>
        {isFounder && (
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {canMoveLeft && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(card.id, columnId, 'left')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                {canMoveRight && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(card.id, columnId, 'right')}>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                )}
                {columnId === 'ideas' && (
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
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
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {card.tags?.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          <div className="flex -space-x-2">
            <TooltipProvider>
              {card.assignees?.map(assignee => (
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
}

function SortableKanbanCard({ card, columnId, onMove }: { card: RoadmapCardType; columnId: string; onMove: (cardId: string, oldColumnId: string, direction: 'left' | 'right') => void; }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && 'opacity-50')}>
            <KanbanCard card={card} columnId={columnId} onMove={onMove} />
        </div>
    )
}

function KanbanColumn({ id, title, cards, children, onMoveCard }: RoadmapColumnType & { children?: React.ReactNode; onMoveCard: (cardId: string, oldColumnId: string, direction: 'left' | 'right') => void; }) {
  const { user } = useUser();
  const isFounder = user?.email === 'gg.el0ai.com@gmail.com';
  
  return (
      <div className="flex flex-col gap-4">
        <div className="px-3 py-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <div className="flex-grow space-y-4 rounded-lg p-3 bg-muted/50 min-h-[200px]">
            {children}
            {id === 'ideas' && isFounder && cards ? (
                <SortableContext id={id} items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map(card => <SortableKanbanCard key={card.id} card={card} columnId={id} onMove={onMoveCard} />)}
                </SortableContext>
            ) : cards && cards.length > 0 ? (
              cards.map(card => <KanbanCard key={card.id} card={card} columnId={id} onMove={onMoveCard} />)
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
  const roadmapQuery = useMemo(() => query(collection(firestore, 'roadmap')), []);
  const [columnsData, isLoading, error] = useCollectionData<RoadmapColumnType>(roadmapQuery);

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
            currentTargetCol.cards = [cardToMove, ...currentTargetCol.cards];
        }
        
        return newColumns;
    });

    const result = await updateRoadmapCardColumn(cardId, sourceColumn.id, targetColumn.id);
    if (result.error) {
        toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
    } else {
        toast({ title: 'Card Moved!', description: 'Roadmap has been updated.' });
    }
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;
    
    // This logic only handles reordering within the 'ideas' column
    if (over.id !== 'ideas') return;
    
    setColumns(prevColumns => {
      const ideasColumn = prevColumns.find(col => col.id === 'ideas');
      if (!ideasColumn) return prevColumns;

      const oldIndex = ideasColumn.cards.findIndex(card => card.id === active.id);
      const newIndex = ideasColumn.cards.findIndex(card => card.id === over.id || (Array.isArray(over.data.current?.sortable?.items) && over.data.current.sortable.items.includes(card.id)));

      if (oldIndex === -1 || newIndex === -1) return prevColumns;
      
      const reorderedCards = arrayMove(ideasColumn.cards, oldIndex, newIndex);
      
      // Update the Firestore database
      updateRoadmapCardOrder('ideas', reorderedCards).then(result => {
        if (result.error) {
          toast({ variant: 'destructive', title: 'Reorder Failed', description: result.error });
          // The UI will revert on the next Firestore snapshot if the update fails.
        }
      });
      
      return prevColumns.map(col => 
        col.id === 'ideas' ? { ...col, cards: reorderedCards } : col
      );
    });
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
                <CardDescription>There was an error connecting to the database.</CardDescription>
            </CardHeader>
            <CardContent>
                <pre className="text-xs mt-2">{error.message}</pre>
            </CardContent>
        </Card>
      )}
      
      {!isLoading && !error && (
         <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 gap-8">
                {columns && columns.length > 0 ? (
                    columns.map(col => (
                    <KanbanColumn key={col.id} {...col} onMoveCard={handleMoveCard}>
                        {col.id === 'ideas' && isFounder && <AddIdeaForm />}
                    </KanbanColumn>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground">Could not load roadmap columns.</p>
                )}
            </div>
         </DndContext>
      )}
    </main>
  );
}
