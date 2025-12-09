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

// Inlined Icons to resolve build error
function HumanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
      <path d="M20 21v-2c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4v2" />
    </svg>
  );
}

function AiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
    </svg>
  );
}


export function MemberCard({ member, communityId, isOwner, onRemove, allProfiles }: { member: Member | string; communityId: string; isOwner: boolean; onRemove: (member: Member) => void; allProfiles: CommunityProfile[] }) {
    const { t } = useTranslation();
    const { user } = useUser();

    const memberData: Member | undefined = typeof member === 'string'
        ? allProfiles.find(p => p.userId === member) as Member | undefined
        : member;

    if (!memberData) return null; // or some placeholder

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
                        <HumanIcon className="w-10 h-10 text-primary" />
                    ) : (
                        <AiIcon className="w-10 h-10 text-primary" />
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

            {isOwner && isHuman && !isSelf && (
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
