// src/app/community/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, ArrowLeft, Bot, User, PlusCircle, Send } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type Member = {
  name: string;
  role: string;
  bio: string;
  type: 'AI' | 'human';
  avatarUrl?: string;
  userId?: string;
};

type Community = {
  id:string;
  name: string;
  description: string;
  welcomeMessage: string;
  ownerId: string;
  members: Member[];
};

type CommunityProfile = {
    id: string;
    userId: string;
    name: string;
    bio: string;
    nativeLanguage: string;
    learningLanguage: string;
};

function MemberCard({ member, index, communityId }: { member: Member; index: number; communityId: string;}) {
    const isHuman = member.type === 'human';
    const avatarUrl = `https://i.pravatar.cc/150?u=${member.name}-${index}`;
    
    const Wrapper = Link;
    
    let href = '#';
    if(isHuman && member.userId) {
        href = `/profile/${member.userId}`;
    } else if (!isHuman) {
        href = `/community/${communityId}/member/${encodeURIComponent(member.name)}`;
    }

    return (
      <Wrapper href={href}>
        <Card className={cn(
            "shadow-md transition-all h-full hover:shadow-lg hover:-translate-y-1 hover:bg-muted/50 cursor-pointer"
        )}>
            <CardHeader className="flex flex-row items-start gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarImage src={avatarUrl} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <CardTitle>{member.name}</CardTitle>
                <CardDescription className="text-primary font-medium">{member.role}</CardDescription>
            </div>
            {member.type === 'AI' ? (
                <Badge variant="outline" className="flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    AI Member
                </Badge>
            ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Human
                </Badge>
            )}
            </CardHeader>
            <CardContent>
            <p className="text-muted-foreground">{member.bio}</p>
            </CardContent>
        </Card>
      </Wrapper>
    );
}

export default function CommunityProfilePage() {
  const params = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // This reference is tricky. We don't know the owner's ID upfront.
  // This hook will fail until we find the community and its owner.
  // Let's adjust the logic. We need to fetch the community first, but from where?
  // We can't assume the current user is the owner.
  // This indicates a modeling issue. A community should probably be a top-level collection.
  // For now, let's assume we can only view our own communities.
  const communityDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    // THIS IS THE PROBLEM: It assumes the logged-in user is the owner.
    // We need a way to look up communities by ID regardless of owner.
    // For now, this will only work for communities the current user owns.
    return doc(firestore, 'users', user.uid, 'communities', id);
  }, [firestore, user, id]);

  const { data: community, isLoading, error } = useDoc<Community>(communityDocRef);
  
  const ownerProfileRef = useMemoFirebase(() => {
    if (!firestore || !community?.ownerId) return null;
    return doc(firestore, 'community-profiles', community.ownerId);
  }, [firestore, community?.ownerId]);

  const { data: ownerProfile } = useDoc<CommunityProfile>(ownerProfileRef);
  
  const allProfilesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'community-profiles');
  }, [firestore]);

  const { data: allProfiles, isLoading: profilesLoading } = useCollection<CommunityProfile>(allProfilesQuery);

  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<CommunityProfile[]>([]);

  const isOwner = user?.uid === community?.ownerId;
  const isMember = allMembers.some(m => m.userId === user?.uid);


  useEffect(() => {
    if (community) {
      let members: Member[] = [...(community.members || [])];
      if (ownerProfile) {
        const ownerMember: Member = {
          userId: ownerProfile.userId,
          name: ownerProfile.name,
          role: 'Founder',
          bio: ownerProfile.bio,
          type: 'human',
        };
        // Add the owner to the start of the list if not already present
        if (!members.some(m => m.userId === ownerMember.userId)) {
          members.unshift(ownerMember);
        }
      }
      setAllMembers(members);
    }
  }, [community, ownerProfile]);
  
  useEffect(() => {
    if (allProfiles && allMembers.length > 0) {
      const memberUserIds = new Set(allMembers.filter(m => m.userId).map(m => m.userId));
      const suggestions = allProfiles.filter(p => !memberUserIds.has(p.userId));
      setSuggestedUsers(suggestions);
    }
  }, [allProfiles, allMembers]);


  if (isLoading || profilesLoading) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4">An Error Occurred</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              There was a problem loading this community. This might be a private community you do not have access to.
            </p>
            <pre className="mb-4 text-left text-sm bg-muted p-2 rounded-md overflow-x-auto">
              <code>{error.message}</code>
            </pre>
            <Button asChild variant="outline">
              <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Your Communities
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  if (!community) {
    return (
        <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
          <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <CardTitle>Community Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">We couldn't find the community you were looking for. It may be private or you may need to be logged in as the owner to see it.</p>
              <Button asChild variant="outline">
              <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Your Communities
              </Link>
            </Button>
            </CardContent>
          </Card>
        </main>
      );
  }

  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <Button asChild variant="ghost">
            <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Communities
            </Link>
        </Button>
        {user && !isOwner && !isMember && (
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Request to Join
            </Button>
        )}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
          {community.name}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{community.description}</p>
      </div>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Welcome Message</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{community.welcomeMessage}</p>
        </CardContent>
      </Card>
      
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Meet the Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allMembers.map((member, index) => (
            <MemberCard key={`${member.name}-${index}`} member={member} index={index} communityId={community.id} />
          ))}
        </div>
      </div>
      
      {isOwner && (
        <>
            <Separator className="my-12" />
            <div>
                <h2 className="text-3xl font-bold text-center mb-8">Invite Members</h2>
                {suggestedUsers.length > 0 ? (
                    <div className="space-y-4">
                        {suggestedUsers.map(profile => (
                            <Card key={profile.id} className="flex items-center p-4">
                                <Avatar className="w-12 h-12 mr-4">
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${profile.name}`} alt={profile.name} />
                                    <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <Link href={`/profile/${profile.id}`} className="font-bold hover:underline">{profile.name}</Link>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
                                </div>
                                <Button variant="outline" size="sm" disabled>
                                    <Send className="mr-2 h-4 w-4" />
                                    Invite
                                </Button>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="flex items-center justify-center p-8">
                        <p className="text-muted-foreground">No new users to invite right now.</p>
                    </Card>
                )}
            </div>
        </>
      )}

    </main>
  );
}
