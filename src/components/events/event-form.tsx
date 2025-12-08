// src/components/events/event-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { EventSchema as BaseEventSchema, type Event } from '@/lib/types';
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
import { getFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import { useTranslation } from '@/hooks/use-translation';

// The form needs to work with a JS Date object.
const EventFormSchema = BaseEventSchema.extend({
  date: z.date({
    required_error: "A date for the event is required.",
  }),
});


interface EventFormProps {
    user: User;
    onFormSubmit: () => void;
    onCancel: () => void;
    eventToEdit?: Event | null;
}

export function EventForm({ user, onFormSubmit, onCancel, eventToEdit }: EventFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Reliably convert Firestore Timestamp to JS Date for the form's default value.
  const defaultDate = eventToEdit?.date
    ? (eventToEdit.date instanceof Timestamp ? eventToEdit.date.toDate() : new Date(eventToEdit.date))
    : undefined;

  const form = useForm<z.infer<typeof EventFormSchema>>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: eventToEdit ? {
      ...eventToEdit, // Spread existing event data first
      date: defaultDate, // Then override the date with the converted JS Date
    } : {
      title: '',
      description: '',
      location: '',
      date: undefined,
      organizerId: user.uid,
      organizerName: user.displayName || 'Anonymous',
      attendees: [], // Only default to empty for new events
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: z.infer<typeof EventFormSchema>) => {
    const { firestore } = getFirebase();
    if (!firestore) {
        toast({ variant: "destructive", title: t('toast_db_error') });
        return;
    }
    
    if (!values.date) {
        form.setError("date", { type: "manual", message: "A date for the event is required."});
        return;
    }

    try {
        const eventData = { ...values, date: Timestamp.fromDate(values.date) };

        if (eventToEdit) {
            const eventDocRef = doc(firestore, 'events', eventToEdit.id);
            // Ensure we don't try to write the 'id' field back into the document body
            const { id, ...dataToUpdate } = eventData;
            await setDoc(eventDocRef, dataToUpdate, { merge: true });
            toast({ title: t('toast_event_updated') });
        } else {
            const collectionRef = collection(firestore, 'events');
            await addDoc(collectionRef, eventData);
            toast({ title: t('toast_event_created') });
        }
        onFormSubmit();
    } catch (error) {
        console.error("Error saving event:", error);
        toast({
            variant: "destructive",
            title: t('toast_event_save_failed_title'),
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{eventToEdit ? t('event_form_edit_title') : t('event_form_create_title')}</CardTitle>
        <CardDescription>{t('event_form_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('event_form_title_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('event_form_title_placeholder')} {...field} />
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
                  <FormLabel>{t('event_form_desc_label')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('event_form_desc_placeholder')} {...field} />
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
                    <FormLabel>{t('event_form_location_label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('event_form_location_placeholder')} {...field} />
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
                    <FormLabel>{t('event_form_date_label')}</FormLabel>
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
                              <span>{t('event_form_date_placeholder')}</span>
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
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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
              <Button type="button" variant="ghost" onClick={onCancel}>{t('dialog_cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {eventToEdit ? t('event_form_save_button') : t('events_create_button')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
