// src/app/profile/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoaderCircle, AlertCircle, ArrowLeft, Languages, User, BookUser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type CommunityProfile = {
    id: string;
    userId: string;
    name: string;
    bio: string;
    nativeLanguage: string;
    learningLanguage: string;
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const profileDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'community-profiles', id);
  }, [firestore, id]);

  const { data: profile, isLoading, error } = useDoc<CommunityProfile>(profileDocRef);

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
            <CardTitle className="mt-4">Error Loading Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              There was a problem loading this profile.
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

  if (!profile) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>This user profile does not exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  const isOwnProfile = currentUser?.uid === profile.userId;

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="mb-4">
        <Button onClick={() => router.back()} variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader className="text-center items-center space-y-4">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${profile.name}`} alt={profile.name} />
            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{profile.name}</CardTitle>
          
          {isOwnProfile && (
             <Button asChild variant="link">
                <Link href="/profile">Edit Your Profile</Link>
             </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><User className="w-5 h-5"/> Bio</h3>
                <p className="text-lg bg-muted p-4 rounded-md">{profile.bio}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><BookUser className="w-5 h-5"/> Native Language</h3>
                    <p className="text-lg">{profile.nativeLanguage}</p>
                </div>
                 <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><Languages className="w-5 h-5"/> Learning Language</h3>
                    <p className="text-lg">{profile.learningLanguage}</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
