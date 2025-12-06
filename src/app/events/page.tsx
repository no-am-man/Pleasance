// src/app/events/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser, firestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle, LoaderCircle, CalendarHeart } from 'lucide-react';
import { EventForm } from '@/components/events/event-form';
import { EventCard } from '@/components/events/event-card';
import { type Event } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';

export default function EventsPage() {
  const { user } = useUser();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const eventsQuery = query(collection(firestore, 'events'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
        } as Event;
      });
      setEvents(eventsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };
  
  const handleFormClose = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  return (
    <main className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3">
            <CalendarHeart className="w-10 h-10" />
            {t('events_page_title')}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">{t('events_page_subtitle')}</p>
        </div>
        {user && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('events_create_button')}
          </Button>
        )}
      </div>

      {showForm && user && (
        <div className="mb-8">
          <EventForm 
            user={user} 
            onFormSubmit={handleFormClose} 
            onCancel={handleFormClose} 
            eventToEdit={editingEvent}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-6">
          {events.map(event => (
            <EventCard key={event.id} event={event} currentUser={user} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>{t('events_no_events_p1')}</p>
          <p>{t('events_no_events_p2')}</p>
        </div>
      )}
    </main>
  );
}
