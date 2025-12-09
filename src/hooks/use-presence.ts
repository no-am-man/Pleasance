// src/hooks/use-presence.ts
'use client';

import { useEffect, useCallback } from 'react';
import { useUser } from '@/firebase';
import { getFirebase } from '@/firebase/config';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, onValue, onDisconnect, set, serverTimestamp as dbServerTimestamp, goOnline, goOffline, Database, Unsubscribe } from 'firebase/database';
import type { User } from 'firebase/auth';

// --- OBSERVER PATTERN IMPLEMENTATION ---

// The Subject (or Observable)
class PresenceMonitor {
    private observers: PresenceObserver[] = [];
    private unsubscribe: Unsubscribe | null = null;
    private database: Database;

    constructor() {
        this.database = getFirebase().database;
    }

    public attach(observer: PresenceObserver): void {
        const isExist = this.observers.includes(observer);
        if (isExist) {
            return;
        }
        this.observers.push(observer);
    }

    public detach(observer: PresenceObserver): void {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex === -1) {
            return;
        }
        this.observers.splice(observerIndex, 1);
    }

    public notify(user: User, isOnline: boolean): void {
        for (const observer of this.observers) {
            observer.update(user, isOnline);
        }
    }

    public startMonitoring(user: User): void {
        if (this.unsubscribe) return; // Already monitoring

        goOnline(this.database);
        const userStatusDatabaseRef = ref(this.database, `/status/${user.uid}`);
        const connectedRef = ref(this.database, '.info/connected');

        this.unsubscribe = onValue(connectedRef, (snapshot) => {
            const isConnected = snapshot.val() === true;
            this.notify(user, isConnected);
            
            if (isConnected) {
                onDisconnect(userStatusDatabaseRef).set({
                    state: 'offline',
                    last_changed: dbServerTimestamp(),
                }).then(() => {
                    set(userStatusDatabaseRef, {
                        state: 'online',
                        last_changed: dbServerTimestamp(),
                    });
                });
            }
        });
    }

    public stopMonitoring(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
            goOffline(this.database);
        }
    }
}

// The Observer interface
interface PresenceObserver {
    update(user: User, isOnline: boolean): void;
}

// A Concrete Observer that updates Firestore
class FirestoreUpdater implements PresenceObserver {
    public update(user: User, isOnline: boolean): void {
        if (!isOnline) return;

        const { firestore } = getFirebase();
        const userStatusFirestoreRef = doc(firestore, `/presence/${user.uid}`);
        
        const presenceData = {
            userName: user.displayName || 'Anonymous',
            avatarUrl: user.photoURL || '',
            userId: user.uid,
            lastSeen: serverTimestamp(),
        };

        setDoc(userStatusFirestoreRef, presenceData, { merge: true });
    }
}

// Create a single, shared instance of the monitor (could also be done with a context)
const presenceMonitor = new PresenceMonitor();
const firestoreUpdater = new FirestoreUpdater();
presenceMonitor.attach(firestoreUpdater);

// --- END OBSERVER PATTERN ---

// The hook now uses the Observer pattern
export function usePresence() {
  const { user } = useUser();

  useEffect(() => {
    if (user?.uid) {
        presenceMonitor.startMonitoring(user);
    }

    // When the hook unmounts (user logs out), stop monitoring.
    return () => {
      presenceMonitor.stopMonitoring();
    };
  }, [user]); // Only depends on the user object
}
