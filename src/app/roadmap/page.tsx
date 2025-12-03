
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
import { LoaderCircle, PlusCircle, Trash2 } from 'lucide-react';
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
import { updateRoadmapCardColumn, addRoadmapCard, deleteRoadmapCard } from '../actions';
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


const AddIdeaSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long."),
    description: z.string().min(10, "Description must be at least 10 characters long."),
});

function AddIdeaForm() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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
                                    <FormControl>
                                        <Textarea placeholder="Describe the idea..." {...field} />
                                    </FormControl>
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

const SortableKanbanCard = ({ card, columnId }: { card: RoadmapCardType; columnId: string; }) => {
  const { user } = useUser();
  const isFounder = user?.email === 'gg.el0ai.com@gmail.com';
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };
  
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
    // No need to set isDeleting to false as the component will unmount
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="bg-card/70 hover:bg-card transition-all cursor-grab active:cursor-grabbing group">
        <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
          <CardTitle className="text-base">{card.title}</CardTitle>
          {isFounder && columnId === 'ideas' && (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
}

const KanbanColumn = ({ id, title, cards, children }: RoadmapColumnType & { children?: React.ReactNode }) => (
  <div className="flex flex-col gap-4">
    <div className="px-3 py-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <div className="flex-grow space-y-4 rounded-lg p-3 bg-muted/50 min-h-[200px]">
        {children}
      <SortableContext id={id} items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        {cards && cards.length > 0 ? (
          cards.map(card => <SortableKanbanCard key={card.id} card={card} columnId={id} />)
        ) : (
          !children && (
             <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                <p>No cards in this column.</p>
            </div>
          )
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
    
    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId || over.id;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
        // Logic for reordering within the same column (optional)
        if (activeContainer && overContainer && activeContainer === overContainer) {
            setColumns((prev) => {
                const activeColumnIndex = prev.findIndex(c => c.id === activeContainer);
                if (activeColumnIndex === -1) return prev;

                const activeColumn = prev[activeColumnIndex];
                const oldIndex = activeColumn.cards.findIndex(c => c.id === active.id);
                const newIndex = activeColumn.cards.findIndex(c => c.id === over.id);
                
                const newCards = arrayMove(activeColumn.cards, oldIndex, newIndex);
                const newColumns = [...prev];
                newColumns[activeColumnIndex] = { ...activeColumn, cards: newCards };

                return newColumns;
            });
        }
        return;
    }
    
    // Optimistically update UI
    setColumns(prevColumns => {
        const activeColumnIndex = prevColumns.findIndex(col => col.id === activeContainer);
        const overColumnIndex = prevColumns.findIndex(col => col.id === overContainer);
        if (activeColumnIndex === -1 || overColumnIndex === -1) return prevColumns;
        
        const activeColumn = prevColumns[activeColumnIndex];
        const overColumn = prevColumns[overColumnIndex];
        
        const activeItemIndex = activeColumn.cards.findIndex(c => c.id === active.id);
        const [movedCard] = activeColumn.cards.splice(activeItemIndex, 1);
        
        const overItemIndex = overColumn.cards.findIndex(c => c.id === over.id);
        overColumn.cards.splice(overItemIndex !== -1 ? overItemIndex : overColumn.cards.length, 0, movedCard);
        
        let newColumns = [...prevColumns];
        newColumns[activeColumnIndex] = {...activeColumn};
        newColumns[overColumnIndex] = {...overColumn};

        return newColumns;
    });

    // Update Firestore
    const result = await updateRoadmapCardColumn(active.id as string, activeContainer, overContainer);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
      // useCollectionData will automatically revert the state on error from Firestore.
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
                <CardDescription>There was an error connecting to the database.</CardDescription>
            </CardHeader>
            <CardContent>
                <pre className="text-xs mt-2">{error.message}</pre>
            </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
         <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {columns.map(column => (
                    <KanbanColumn key={column.id} {...column}>
                        {column.id === 'ideas' && isFounder && <AddIdeaForm />}
                    </KanbanColumn>
                ))}
            </div>
         </DndContext>
      )}
    </main>
  );
}
