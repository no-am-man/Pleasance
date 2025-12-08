// src/components/events/event-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { arrayRemove, arrayUnion, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { getFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import type { Event } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/use-translation';

interface EventCardProps {
  event: Event;
  currentUser: User | null;
  onEdit: (event: Event) => void;
}

export function EventCard({ event, currentUser, onEdit }: EventCardProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const isOrganizer = currentUser?.uid === event.organizerId;
  const isAttending = event.attendees.includes(currentUser?.uid || '');

  const handleRsvp = async () => {
    const { firestore } = getFirebase();
    if (!currentUser || !firestore) {
        toast({ variant: "destructive", title: t('toast_rsvp_login_required')});
        return;
    };
    const eventDocRef = doc(firestore, 'events', event.id);
    try {
        await updateDoc(eventDocRef, {
            attendees: isAttending ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
        });
        toast({ title: isAttending ? t('toast_rsvp_cancelled') : t('toast_rsvp_success') });
    } catch(e) {
        console.error("RSVP error:", e);
        toast({ variant: "destructive", title: t('toast_rsvp_failed') });
    }
  };
  
  const handleDelete = async () => {
    const { firestore } = getFirebase();
    if (!firestore) return;
    const eventDocRef = doc(firestore, 'events', event.id);
    try {
        await deleteDoc(eventDocRef);
        toast({ title: t('toast_event_deleted') });
    } catch(e) {
        console.error("Delete error:", e);
        toast({ variant: "destructive", title: t('toast_event_delete_failed') });
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>{t('event_card_organized_by', { name: event.organizerName })}</CardDescription>
            </div>
            {isOrganizer && (
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(event)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>{t('event_card_delete_dialog_title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('event_card_delete_dialog_desc', { title: event.title })}
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>{t('dialog_cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{t('dialog_delete')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{event.description}</p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{event.date ? format(event.date instanceof Timestamp ? event.date.toDate() : new Date(event.date), 'MMMM d, yyyy') : 'Date not set'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{event.location}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">{event.attendees.length} {t('event_card_attending')}</span>
        </div>
        {currentUser && (
            <Button onClick={handleRsvp} variant={isAttending ? "secondary" : "default"}>
                {isAttending ? t('event_card_cancel_rsvp') : t('event_card_rsvp')}
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
