// src/app/community/[id]/member/[memberName]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoaderCircle, AlertCircle, ArrowLeft, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Member = {
  name: string;
  role: string;
  bio: string;
  type: 'AI' | 'human';
};

type Community = {
  id: string;
  name: string;
  description: string;
  welcomeMessage: string;
  ownerId: string;
  members: Member[];
};

export default function AiMemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();

  const communityId = Array.isArray(params.id) ? params.id[0] : params.id;
  const memberName = Array.isArray(params.memberName) ? params.memberName[0] : params.memberName;

  const communityDocRef = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    // Fetch from the top-level 'communities' collection
    return doc(firestore, 'communities', communityId);
  }, [firestore, communityId]);

  const { data: community, isLoading, error } = useDoc<Community>(communityDocRef);

  const member = community?.members.find(
    (m) => m.name === decodeURIComponent(memberName)
  );

  if (isLoading) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
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
            <CardTitle className="mt-4">Error Loading Community</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              There was a problem loading the community data to find this member.
            </p>
            <pre className="mb-4 text-left text-sm bg-muted p-2 rounded-md overflow-x-auto">
              <code>{error.message}</code>
            </pre>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!member) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle>Member Not Found</CardTitle>
            <CardDescription>This AI member does not exist in this community.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
                <Link href={`/community/${communityId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Community
                </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="mb-4">
        <Button asChild variant="ghost">
            <Link href={`/community/${communityId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to {community?.name}
            </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader className="text-center items-center">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${member.name}`} alt={member.name} />
            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{member.name}</CardTitle>
          <CardDescription className="text-lg text-primary font-medium">{member.role}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><Bot className="w-5 h-5"/> Bio</h3>
                <p className="text-lg bg-muted p-4 rounded-md">{member.bio}</p>
            </div>
             <Card className="bg-background/50">
                <CardHeader>
                    <CardTitle>Interact with {member.name}</CardTitle>
                    <CardDescription>This is where you'll be able to chat with this AI. Coming soon!</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-md">
                        <p className="text-muted-foreground">Chat interface coming soon...</p>
                    </div>
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </main>
  );
}
