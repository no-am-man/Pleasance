
// src/components/events/event-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EventSchema, type Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, LoaderCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { addDoc, collection, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';

interface EventFormProps {
    user: User;
    onFormSubmit: () => void;
    onCancel: () => void;
    eventToEdit?: Event | null;
}

export function EventForm({ user, onFormSubmit, onCancel, eventToEdit }: EventFormProps) {
  const { toast } = useToast();
  const form = useForm<Event>({
    resolver: zodResolver(EventSchema),
    defaultValues: eventToEdit ? {
      ...eventToEdit,
      date: new Date(eventToEdit.date),
    } : {
      title: '',
      description: '',
      location: '',
      date: new Date(),
      organizerId: user.uid,
      organizerName: user.displayName || 'Anonymous',
      attendees: [],
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: Event) => {
    if (!firestore) {
        toast({ variant: "destructive", title: "Database error" });
        return;
    }
    
    try {
        if (eventToEdit) {
            const eventDocRef = doc(firestore, 'events', eventToEdit.id);
            await setDoc(eventDocRef, { ...values, date: Timestamp.fromDate(values.date) }, { merge: true });
            toast({ title: 'Event updated successfully!' });
        } else {
            const collectionRef = collection(firestore, 'events');
            await addDoc(collectionRef, { ...values, date: Timestamp.fromDate(values.date) });
            toast({ title: 'Event created successfully!' });
        }
        onFormSubmit();
    } catch (error) {
        console.error("Error saving event:", error);
        toast({
            variant: "destructive",
            title: "Failed to save event",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{eventToEdit ? 'Edit Event' : 'Create a New Event'}</CardTitle>
        <CardDescription>Fill out the details for your get-together.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Weekly Chess Meetup" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us about the event..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Central Park or Discord link" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date & Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {eventToEdit ? 'Save Changes' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
