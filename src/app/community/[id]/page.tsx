// src/app/community/[id]/page.tsx
import { notFound } from 'next/navigation';
import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore } from 'firebase-admin/firestore';
import type { Community, Member, CommunityProfile } from '@/lib/types';
import { CommunityClientPage } from './client-page';

async function getCommunity(id: string): Promise<Community | null> {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const communityDoc = await firestore.collection('communities').doc(id).get();

        if (!communityDoc.exists) {
            return null;
        }

        const communityData = communityDoc.data() as Omit<Community, 'id' | 'members'>;

        // Ensure members is an array before processing
        const membersArray = Array.isArray(communityData.members) ? communityData.members : [];

        // Hydrate member strings into full Member objects
        const memberPromises = membersArray.map(async (member) => {
            if (typeof member === 'string') {
                try {
                    const profileDoc = await firestore.collection('community-profiles').doc(member).get();
                    if (profileDoc.exists()) {
                        const profile = profileDoc.data() as CommunityProfile;
                        return {
                            userId: profile.userId,
                            name: profile.name,
                            bio: profile.bio,
                            role: 'Member',
                            type: 'human',
                            avatarUrl: profile.avatarUrl || '',
                        } as Member;
                    }
                } catch (e) {
                     console.error(`Failed to fetch profile for member ID: ${member}`, e);
                }
                return null; // Member string ID doesn't correspond to a profile or failed to fetch
            }
            return member as Member; // Already a member object (AI)
        });

        const resolvedMembers = (await Promise.all(memberPromises)).filter(m => m !== null) as Member[];
        
        // Ensure the owner is always included if they are not in the members list
        if (!resolvedMembers.some(m => m.userId === communityData.ownerId)) {
            const ownerProfileDoc = await firestore.collection('community-profiles').doc(communityData.ownerId).get();
            if (ownerProfileDoc.exists()) {
                 const ownerProfile = ownerProfileDoc.data() as CommunityProfile;
                 resolvedMembers.unshift({
                    userId: ownerProfile.userId,
                    name: ownerProfile.name,
                    bio: ownerProfile.bio,
                    role: 'Founder',
                    type: 'human',
                    avatarUrl: ownerProfile.avatarUrl || '',
                 });
            }
        }


        return {
            id: communityDoc.id,
            ...communityData,
            members: resolvedMembers,
        };
    } catch (error) {
        console.error("Error fetching community on server:", error);
        return null;
    }
}


async function getAllCommunities(): Promise<Community[]> {
    try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const snapshot = await firestore.collection('communities').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
    } catch (error) {
        console.error("Error fetching all communities on server:", error);
        return [];
    }
}

async function getAllProfiles(): Promise<CommunityProfile[]> {
     try {
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        const snapshot = await firestore.collection('community-profiles').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityProfile));
    } catch (error) {
        console.error("Error fetching all profiles on server:", error);
        return [];
    }
}


export default async function CommunityProfilePage({ params }: { params: { id: string } }) {
  const community = await getCommunity(params.id);

  if (!community) {
    notFound();
  }

  // Fetch ancillary data on the server and pass it down
  const allCommunities = await getAllCommunities();
  const allProfiles = await getAllProfiles();

  return <CommunityClientPage serverCommunity={community} allCommunities={allCommunities} allProfiles={allProfiles} />;
}
