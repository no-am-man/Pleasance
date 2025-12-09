// src/app/roadmap-actions.ts
'use server';

import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue, arrayRemove } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

export async function addRoadmapCard(values: { title: string, description: string }) {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const ideasRef = firestore.collection('roadmap').doc('ideas');
        
        await ideasRef.update({
            cards: FieldValue.arrayUnion({
                id: uuidv4(),
                title: values.title,
                description: values.description,
                tags: ['new-idea'],
                assignees: [],
            })
        });
        return { success: true };
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' };
    }
}

export async function deleteRoadmapCard(cardId: string, columnId: string) {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const columnRef = firestore.collection('roadmap').doc(columnId);
        
        const columnDoc = await columnRef.get();
        if (!columnDoc.exists) {
            throw new Error('Column not found');
        }
        
        const columnData = columnDoc.data();
        const cardToRemove = columnData?.cards.find((c: any) => c.id === cardId);
        
        if (cardToRemove) {
            await columnRef.update({
                cards: arrayRemove(cardToRemove)
            });
        }
        
        return { success: true };
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' };
    }
}
