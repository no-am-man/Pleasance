
// src/components/community/MemberCard.tsx
'use client';

import type { SVGProps } from 'react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, User, UserX } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import type { Member, CommunityProfile } from '@/lib/types';
import { useUser } from '@/firebase';
import { useMemo } from 'react';

export function MemberCard({ member, communityId, isOwner, onRemove, allProfiles }: { member: Member | string; communityId: string; isOwner: boolean; onRemove: (member: Member) => void; allProfiles: CommunityProfile[] }) {
    const { t } = useTranslation();
    const { user } = useUser();

    // Hydrate string member IDs with profile data
    const memberData = useMemo(() => {
        if (typeof member === 'string') {
            const profile = allProfiles.find(p => p.userId === member);
            if (profile) {
                return {
                    userId: profile.userId,
                    name: profile.name,
                    bio: profile.bio,
                    role: 'Member', // Default role for hydrated members
                    type: 'human',
                    avatarUrl: profile.avatarUrl,
                } as Member;
            }
            // If the profile for the string ID isn't found in allProfiles, return null.
            return null;
        }
        // If it's already a Member object, just return it.
        return member;
    }, [member, allProfiles]);

    // CRITICAL FIX: If memberData could not be resolved, do not render anything.
    // This prevents rendering a card with an invalid link while data is loading.
    if (!memberData) {
        return null; 
    }

    const isHuman = memberData.type === 'human';
    const isSelf = isHuman && user?.uid === memberData.userId;
    
    const memberLink = isHuman && memberData.userId
      ? `/profile/${memberData.userId}`
      : !isHuman
      ? `/community/${communityId}/member/${encodeURIComponent(memberData.name)}`
      : '#';

    return (
      <div className="flex items-center gap-4 rounded-md border p-4 transition-colors hover:bg-muted/50 group">
        <Link href={memberLink}>
            <Avatar className="w-16 h-16 rounded-lg bg-background border-2 border-primary/20 cursor-pointer">
                <AvatarImage src={memberData.avatarUrl || `https://i.pravatar.cc/150?u=${memberData.userId || memberData.name}`} />
                <AvatarFallback>
                    {isHuman ? (
                        <User className="w-10 h-10 text-primary" />
                    ) : (
                        <Bot className="w-10 h-10 text-primary" />
                    )}
                </AvatarFallback>
            </Avatar>
        </Link>
        <div className="flex-1 space-y-1">
            <Link href={memberLink}>
                <span className="font-semibold text-lg group-hover:underline cursor-pointer">{memberData.name}</span>
            </Link>
          <p className="text-sm text-primary font-medium">{memberData.role}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{memberData.bio}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            {isHuman ? (
                <Badge variant="secondary" className="flex-shrink-0"><User className="w-3 h-3 mr-1" /> {t('community_page_member_type_human')}</Badge>
            ) : (
                <Badge variant="outline" className="flex-shrink-0"><Bot className="w-3 h-3 mr-1" /> {t('community_page_member_type_ai')}</Badge>
            )}

            {isOwner && !isSelf && (
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                          <UserX className="w-4 h-4" />
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>{t('community_page_remove_member_dialog_title', { name: memberData.name })}</AlertDialogTitle>
                          <AlertDialogDescription>
                              {t('community_page_remove_member_dialog_desc')}
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>{t('community_page_delete_cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onRemove(memberData)} className="bg-destructive hover:bg-destructive/90">
                              {t('community_page_remove_member_confirm')}
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            )}
        </div>
      </div>
    );
}
