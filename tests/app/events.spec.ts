// tests/app/events.spec.ts
import { test, expect, describe, beforeAll, afterAll } from 'vitest';
import { getFirebase } from '@/firebase/config';
import { addDoc, collection, doc, getDoc, getDocs, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { Event } from '@/lib/types';
import type { User } from 'firebase/auth';

const { firestore } = getFirebase();

// Mock User object
const mockUser: User = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    phoneNumber: null,
    providerId: 'google.com',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    tenantId: null,
    getIdToken: async () => 'mock-id-token',
    getIdTokenResult: async () => ({ token: 'mock-id-token', expirationTime: '', authTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, claims: {} }),
    reload: async () => {},
    delete: async () => {},
    toJSON: () => ({})
};

const mockOrganizer: User = {
    uid: 'organizer-user-456',
    email: 'organizer@example.com',
    displayName: 'Organizer User',
    photoURL: null,
    phoneNumber: null,
    providerId: 'google.com',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    tenantId: null,
    getIdToken: async () => 'mock-id-token-organizer',
    getIdTokenResult: async () => ({ token: 'mock-id-token-organizer', expirationTime: '', authTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, claims: {} }),
    reload: async () => {},
    delete: async () => {},
    toJSON: () => ({})
};

let testEventIds: string[] = [];

describe('Events Logic', () => {

    // Cleanup created test events after all tests in this suite have run
    afterAll(async () => {
        const deletePromises = testEventIds.map(id => deleteDoc(doc(firestore, 'events', id)));
        await Promise.all(deletePromises);
        testEventIds = [];
    });

    test('should create a new event successfully', async () => {
        const collectionRef = collection(firestore, 'events');
        
        const newEventData = {
            title: 'Vitest Test Event',
            description: 'This is an event created by a Vitest test.',
            location: 'The Matrix',
            date: new Date(),
            organizerId: mockOrganizer.uid,
            organizerName: mockOrganizer.displayName || 'Organizer',
            attendees: [],
        };
        
        const docRef = await addDoc(collectionRef, newEventData);
        testEventIds.push(docRef.id);

        expect(docRef.id).toBeDefined();
        
        const eventSnap = await getDoc(docRef);
        expect(eventSnap.exists()).toBe(true);
        expect(eventSnap.data()?.title).toBe('Vitest Test Event');

    }, 30000);

    test('should fetch a list of events', async () => {
        // Ensure there's at least one event
        if (testEventIds.length === 0) {
            const docRef = await addDoc(collection(firestore, 'events'), { title: 'Pre-test event' });
            testEventIds.push(docRef.id);
        }

        const eventsQuery = query(collection(firestore, 'events'), orderBy('date', 'desc'));
        const snapshot = await getDocs(eventsQuery);
        const eventsData = snapshot.docs.map(doc => doc.data() as Event);

        expect(Array.isArray(eventsData)).toBe(true);
        expect(eventsData.length).toBeGreaterThan(0);
        expect(eventsData[0].title).toBeDefined();
        console.log(`Successfully fetched ${eventsData.length} events.`);

    }, 30000);

    test('should allow a user to RSVP to an event', async () => {
        const eventDocRef = doc(firestore, 'events', testEventIds[0]);

        // Simulate RSVPing
        await updateDoc(eventDocRef, {
            attendees: arrayUnion(mockUser.uid)
        });

        const updatedEventSnap = await getDoc(eventDocRef);
        const updatedEventData = updatedEventSnap.data() as Event;
        
        expect(updatedEventData.attendees).toBeDefined();
        expect(updatedEventData.attendees).toContain(mockUser.uid);
    }, 30000);

    test('should allow a user to cancel their RSVP', async () => {
        const eventDocRef = doc(firestore, 'events', testEventIds[0]);

        // Simulate cancelling RSVP
        await updateDoc(eventDocRef, {
            attendees: arrayRemove(mockUser.uid)
        });

        const updatedEventSnap = await getDoc(eventDocRef);
        const updatedEventData = updatedEventSnap.data() as Event;

        expect(updatedEventData.attendees).toBeDefined();
        expect(updatedEventData.attendees).not.toContain(mockUser.uid);
    }, 30000);

    test('should allow the organizer to delete the event', async () => {
        // Create a dedicated event for this test to avoid race conditions
        const newEventRef = await addDoc(collection(firestore, 'events'), { title: 'To Be Deleted' });
        const eventId = newEventRef.id;

        const eventDocRef = doc(firestore, 'events', eventId);
        
        // Fetch the event to make sure it exists before deletion
        const eventSnapBeforeDelete = await getDoc(eventDocRef);
        expect(eventSnapBeforeDelete.exists(), 'Event should exist before deletion').toBe(true);
        
        await deleteDoc(eventDocRef);

        const eventSnapAfterDelete = await getDoc(eventDocRef);
        expect(eventSnapAfterDelete.exists(), 'Event should not exist after deletion').toBe(false);
    }, 30000);

});
