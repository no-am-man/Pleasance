// src/app/snapshot-actions.ts
'use server';

import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export async function createHistorySnapshot(values: { userId: string }) {
    const { userId } = values;
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);
    const storiesRef = firestore.collection(`users/${userId}/stories`);
    const snapshotRef = firestore.collection(`users/${userId}/historySnapshots`).doc();

    const storiesSnapshot = await storiesRef.orderBy('createdAt', 'desc').get();
    const stories = storiesSnapshot.docs.map(doc => doc.data());
    const storyCount = stories.length;

    if (storyCount === 0) {
        return { error: "No stories in history to snapshot." };
    }

    const newSnapshot = {
        id: snapshotRef.id,
        userId: userId,
        createdAt: FieldValue.serverTimestamp(),
        storyCount: storyCount,
        stories: stories,
    };
    
    await snapshotRef.set(newSnapshot);
    return { storyCount: storyCount };
}
