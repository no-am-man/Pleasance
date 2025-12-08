// src/lib/seed-roadmap.ts
'use server';
/**
 * @fileOverview Seeds the Firestore database with initial platform data.
 */

import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { Community, Member, RoadmapCard } from './types';

// --- FOUNDER & AI MEMBER DATA ---
const FOUNDER_UID = 'h2b0wMo3A3XgY6p3D0bS1cI2g7m2'; // You can replace this with your actual UID if needed
const FOUNDER_EMAIL = 'gg.el0ai.com@gmail.com';

const FOUNDER_PROFILE = {
    id: FOUNDER_UID,
    userId: FOUNDER_UID,
    name: 'Noam',
    bio: 'Founder of the Pleasance Federation.',
    nativeLanguage: 'English',
    learningLanguage: 'Hebrew',
    avatarUrl: `https://i.pravatar.cc/150?u=${FOUNDER_UID}`,
};

const FOUNDER_MEMBER: Member = {
    userId: FOUNDER_UID,
    name: 'Noam',
    bio: 'Founder of the Pleasance Federation.',
    role: 'Founder',
    type: 'human',
    avatarUrl: FOUNDER_PROFILE.avatarUrl,
};

const CONCIERGE_MEMBER: Member = {
    name: 'Concierge',
    role: 'SuperAgent',
    bio: 'I am the Concierge, here to welcome new members and help them get acquainted with our community.',
    type: 'AI',
    avatarUrl: 'https://i.pravatar.cc/150?u=concierge'
};

// --- COMMUNITY DATA ---
const FOUNDING_COMMUNITY_ID = 'pleasance-founding-community';
const FOUNDING_COMMUNITY: Omit<Community, 'id'> = {
    name: 'Pleasance',
    description: 'The founding community of the federation. A place for meta-discussion, governance, and dreaming of what\'s next.',
    welcomeMessage: 'Welcome, citizen, to the heart of the federation. Here, we discuss the nature of our republic, shape its future, and welcome new souls into the fold.',
    ownerId: FOUNDER_UID,
    members: [FOUNDER_MEMBER, CONCIERGE_MEMBER],
    flagUrl: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMTAwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMjUyQjMyIi8+CjxwYXRoIGQ9Ik0zMCAxNUwzNSA1MEw0MCAxNUw0NSAyNUw1MCAxNUw1NSAyNUw2MCAxNUw2NSAyNUw3MCAxNSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjMwIiByPSIxMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cg==`,
};


// --- ROADMAP DATA ---
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

const publicRoadmapColumns = [
    { id: 'ideas', title: 'Ideas', cards: initialCards.ideas },
    { id: 'nextUp', title: 'Next Up', cards: initialCards.nextUp },
    { id: 'inProgress', title: 'In Progress', cards: initialCards.inProgress },
    { id: 'alive', title: 'Alive', cards: initialCards.alive },
];

const communityRoadmapColumns = [
    { id: 'ideas', title: 'Ideas', cards: [] },
    { id: 'nextUp', title: 'Next Up', cards: [] },
    { id: 'inProgress', title: 'In Progress', cards: [] },
    { id: 'alive', title: 'Alive', cards: [] },
];


export async function seedPlatformData() {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const batch = firestore.batch();
        
        // 1. Seed Public Roadmap
        publicRoadmapColumns.forEach(column => {
            const columnRef = firestore.collection('roadmap').doc(column.id);
            batch.set(columnRef, { title: column.title, id: column.id, cards: column.cards });
        });

        // 2. Seed Founding Community
        const communityRef = firestore.collection('communities').doc(FOUNDING_COMMUNITY_ID);
        batch.set(communityRef, { ...FOUNDING_COMMUNITY, id: FOUNDING_COMMUNITY_ID });

        // 3. Seed Community-specific Roadmap
        communityRoadmapColumns.forEach(column => {
            const columnRef = firestore.collection('communities').doc(FOUNDING_COMMUNITY_ID).collection('roadmap').doc(column.id);
            batch.set(columnRef, column);
        });

        // 4. Seed Founder's Community Profile
        const profileRef = firestore.collection('community-profiles').doc(FOUNDER_UID);
        batch.set(profileRef, FOUNDER_PROFILE);

        // 5. Seed Founder's User Document (can be minimal)
        const userRef = firestore.collection('users').doc(FOUNDER_UID);
        batch.set(userRef, {
            id: FOUNDER_UID,
            email: FOUNDER_EMAIL,
            userName: 'Noam',
        });

        await batch.commit();
        return "Platform seeded successfully: Public roadmap, founding community, and founder profile created.";

    } catch(e) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred during seeding.';
        console.error("Platform Seeding Error:", message);
        throw new Error(message);
    }
}
