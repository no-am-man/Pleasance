// src/app/community/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, ArrowLeft, Bot, User } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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

  const communityDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    return doc(firestore, 'users', user.uid, 'communities', id);
  }, [firestore, user, id]);

  const { data: community, isLoading, error } = useDoc<Community>(communityDocRef);
  
  const ownerProfileRef = useMemoFirebase(() => {
    if (!firestore || !community?.ownerId) return null;
    return doc(firestore, 'community-profiles', community.ownerId);
  }, [firestore, community?.ownerId]);

  const { data: ownerProfile } = useDoc<CommunityProfile>(ownerProfileRef);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

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
        // Add the owner to the start of the list
        members.unshift(ownerMember);
      }
      setAllMembers(members);
    }
  }, [community, ownerProfile]);

  if (isLoading) {
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
              There was a problem loading this community. It might be due to a network issue or missing permissions.
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
              <p className="text-muted-foreground mb-4">We couldn't find the community you were looking for.</p>
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
      <div className="mb-6">
        <Button asChild variant="ghost">
            <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Communities
            </Link>
        </Button>
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
      
      <div>
        <h2 className="text-3xl font-bold text-center mb-8">Meet the Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allMembers.map((member, index) => (
            <MemberCard key={`${member.name}-${index}`} member={member} index={index} communityId={community.id} />
          ))}
        </div>
      </div>

    </main>
  );
}
