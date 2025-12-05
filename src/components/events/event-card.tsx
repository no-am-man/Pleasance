
// src/components/events/event-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { arrayRemove, arrayUnion, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import type { Event } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface EventCardProps {
  event: Event;
  currentUser: User | null;
  onEdit: (event: Event) => void;
}

export function EventCard({ event, currentUser, onEdit }: EventCardProps) {
  const { toast } = useToast();
  const isOrganizer = currentUser?.uid === event.organizerId;
  const isAttending = event.attendees.includes(currentUser?.uid || '');

  const handleRsvp = async () => {
    if (!currentUser || !firestore) {
        toast({ variant: "destructive", title: "You must be logged in to RSVP."});
        return;
    };
    const eventDocRef = doc(firestore, 'events', event.id);
    try {
        await updateDoc(eventDocRef, {
            attendees: isAttending ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
        });
        toast({ title: isAttending ? "You are no longer attending." : "You are now attending!" });
    } catch(e) {
        console.error("RSVP error:", e);
        toast({ variant: "destructive", title: "Failed to update RSVP." });
    }
  };
  
  const handleDelete = async () => {
    if (!firestore) return;
    const eventDocRef = doc(firestore, 'events', event.id);
    try {
        await deleteDoc(eventDocRef);
        toast({ title: "Event deleted successfully." });
    } catch(e) {
        console.error("Delete error:", e);
        toast({ variant: "destructive", title: "Failed to delete event." });
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>Organized by {event.organizerName}</CardDescription>
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
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will permanently delete the event &quot;{event.title}&quot;. This cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
            <span>{format(event.date, 'MMMM d, yyyy')}</span>
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
            <span className="text-sm font-medium">{event.attendees.length} attending</span>
        </div>
        {currentUser && (
            <Button onClick={handleRsvp} variant={isAttending ? "secondary" : "default"}>
                {isAttending ? 'Cancel RSVP' : 'RSVP'}
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
