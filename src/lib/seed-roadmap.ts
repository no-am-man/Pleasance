
// src/lib/seed-roadmap.ts
'use server';
/**
 * @fileOverview Seeds the Firestore database with initial roadmap data.
 */

import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is available or can be added

// Define initial card data
const initialCards = {
  ideas: [
    { id: uuidv4(), title: 'Federated User Profiles', description: 'Allow users to have a central profile that syncs across communities.', tags: ['profile', 'federation'] },
    { id: uuidv4(), title: 'Community Event Calendar', description: 'A shared calendar for communities to post and track events.', tags: ['events', 'community'] },
  ],
  nextUp: [
    { id: uuidv4(), title: 'AI-Assisted Content Creation', description: 'Integrate generative AI to help users create content within workshops.', tags: ['ai', 'content'] },
  ],
  inProgress: [
    { id: uuidv4(), title: 'Public Project Roadmap', description: 'Develop this public-facing roadmap to track project development.', tags: ['governance', 'transparency'], assignees: ['Noam'] },
  ],
  alive: [
    { id: uuidv4(), title: 'Community Creation', description: 'Core functionality for users to create and manage their own communities.', tags: ['community', 'federation'], assignees: ['Noam', 'Gemini'] },
  ]
};

// Define column data
const columns = [
    { id: 'ideas', title: 'Ideas', cards: initialCards.ideas },
    { id: 'nextUp', title: 'Next Up', cards: initialCards.nextUp },
    { id: 'inProgress', title: 'In Progress', cards: initialCards.inProgress },
    { id: 'alive', title: 'Alive', cards: initialCards.alive },
];


export async function seedRoadmapData() {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const batch = firestore.batch();
        
        columns.forEach(column => {
            const columnRef = firestore.collection('roadmap').doc(column.id);
            batch.set(columnRef, { title: column.title, id: column.id, cards: column.cards });
        });

        await batch.commit();
        return "Public roadmap has been seeded successfully.";

    } catch(e) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred during seeding.';
        console.error("Roadmap Seeding Error:", message);
        throw new Error(message);
    }
}

export async function seedCommunityRoadmapData(values: { communityId: string }) {
    const { communityId } = values;
    if (!communityId) {
        throw new Error('Community ID is required to seed a roadmap.');
    }
    
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const batch = firestore.batch();

        const communityColumns = [
            { id: 'ideas', title: 'Ideas', cards: [] },
            { id: 'nextUp', title: 'Next Up', cards: [] },
            { id: 'inProgress', title: 'In Progress', cards: [] },
            { id: 'alive', title: 'Alive', cards: [] },
        ];
        
        communityColumns.forEach(column => {
            const columnRef = firestore.collection('communities').doc(communityId).collection('roadmap').doc(column.id);
            batch.set(columnRef, column);
        });

        await batch.commit();
        return `Roadmap for community ${communityId} has been seeded.`;

    } catch(e) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred during community roadmap seeding.';
        console.error(`Community Roadmap Seeding Error for ${communityId}:`, message);
        throw new Error(message);
    }
}

// NOTE: We need a UUID implementation. A simple one is included here for demonstration.
// In a real app, you would install the `uuid` package.
function v4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
