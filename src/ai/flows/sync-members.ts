
// src/ai/flows/sync-members.ts
'use server';
/**
 * @fileOverview A flow to synchronize member data across all communities.
 *
 * - syncAllMembers - A function that scans and updates member data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase/config-for-actions';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

// Define schema for a member within a community's subcollection
const MemberSchema = z.object({
  userId: z.string().optional(),
  name: z.string(),
  bio: z.string(),
  role: z.string(),
  type: z.enum(['AI', 'human']),
  avatarUrl: z.string().optional(),
});
type Member = z.infer<typeof MemberSchema>;

// Define schema for the top-level community profile
const CommunityProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  bio: z.string(),
  avatarUrl: z.string().optional(),
});
type CommunityProfile = z.infer<typeof CommunityProfileSchema>;

// Define schema for a community document
const CommunitySchema = z.object({
  id: z.string(),
  members: z.array(MemberSchema),
});
type Community = z.infer<typeof CommunitySchema>;

// Define schema for the flow's output
const SyncResultSchema = z.object({
    communitiesScanned: z.number().describe('Total number of communities scanned.'),
    membersSynced: z.number().describe('Total number of human members checked.'),
    issuesFixed: z.number().describe('Number of members whose data was updated.'),
});
export type SyncResult = z.infer<typeof SyncResultSchema>;

export async function syncAllMembers(): Promise<SyncResult> {
  return syncMembersFlow();
}

const syncMembersFlow = ai.defineFlow(
  {
    name: 'syncMembersFlow',
    outputSchema: SyncResultSchema,
  },
  async () => {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    let communitiesScanned = 0;
    let membersSynced = 0;
    let issuesFixed = 0;

    // 1. Fetch all community profiles and map them by userId for quick lookup
    const profilesRef = collection(firestore, 'community-profiles');
    const profilesSnapshot = await getDocs(profilesRef);
    const profilesMap = new Map<string, CommunityProfile>();
    profilesSnapshot.forEach(doc => {
      const profile = doc.data() as CommunityProfile;
      profilesMap.set(profile.userId, profile);
    });

    // 2. Fetch all communities
    const communitiesRef = collection(firestore, 'communities');
    const communitiesSnapshot = await getDocs(communitiesRef);
    communitiesScanned = communitiesSnapshot.size;

    // 3. Iterate over each community to check and update its members
    for (const communityDoc of communitiesSnapshot.docs) {
      const community = communityDoc.data() as Community;
      let needsUpdate = false;
      const updatedMembers: Member[] = [];

      for (const member of community.members) {
        // Only check human members with a userId
        if (member.type === 'human' && member.userId) {
            membersSynced++;
            const masterProfile = profilesMap.get(member.userId);

            if (masterProfile) {
                const currentAvatar = member.avatarUrl || '';
                const masterAvatar = masterProfile.avatarUrl || '';
                
                // Check if any data point is out of sync
                if (
                    member.name !== masterProfile.name ||
                    member.bio !== masterProfile.bio ||
                    currentAvatar !== masterAvatar
                ) {
                    issuesFixed++;
                    needsUpdate = true;
                    updatedMembers.push({
                        ...member,
                        name: masterProfile.name,
                        bio: masterProfile.bio,
                        avatarUrl: masterAvatar,
                    });
                } else {
                    updatedMembers.push(member);
                }
            } else {
                // Member exists in a community but has no master profile, leave them as is.
                updatedMembers.push(member);
            }
        } else {
            // Keep AI members as they are
            updatedMembers.push(member);
        }
      }

      if (needsUpdate) {
        const communityRef = doc(firestore, 'communities', communityDoc.id);
        batch.update(communityRef, { members: updatedMembers });
      }
    }

    // 4. Commit all updates in a single batch
    if (issuesFixed > 0) {
      await batch.commit();
    }

    return {
      communitiesScanned,
      membersSynced,
      issuesFixed,
    };
  }
);
