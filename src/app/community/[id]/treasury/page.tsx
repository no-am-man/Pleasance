
// src/app/community/[id]/treasury/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc, collection, query, orderBy, onSnapshot, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, ArrowLeft, Banknote, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Svg3dCube } from '@/components/icons/svg3d-cube';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { SaveToTreasuryForm } from '@/components/community/SaveToTreasuryForm';

type Community = {
  id:string;
  name: string;
};

type ColorPixel = {
    x: number;
    y: number;
    z: number;
    color: string;
};

type Creation = {
    id: string;
    creatorId: string;
    creatorName: string;
    creatorAvatarUrl: string;
    prompt: string;
    status: 'in-workshop' | 'published';
    createdAt: { seconds: number; nanoseconds: number; };
    pixels: ColorPixel[];
};

export default function CommunityTreasuryPage() {
    const params = useParams();
    const router = useRouter();
    const communityId = Array.isArray(params.id) ? params.id[0] : params.id;
  
    const { user, isUserLoading } = useUser();
    
    const [community, setCommunity] = useState<Community | null>(null);
    const [isCommunityLoading, setIsCommunityLoading] = useState(true);
    
    const [creations, setCreations] = useState<Creation[]>([]);
    const [isCreationsLoading, setIsCreationsLoading] = useState(true);
    const [creationsError, setCreationsError] = useState<Error | null>(null);

    useEffect(() => {
        if (!communityId || !firestore) return;
        setIsCommunityLoading(true);
        const communityDocRef = doc(firestore, 'communities', communityId);
        const unsubscribe = onSnapshot(communityDocRef, (doc) => {
            setCommunity(doc.exists() ? { id: doc.id, ...doc.data() } as Community : null);
            setIsCommunityLoading(false);
        }, (err) => {
            setIsCommunityLoading(false);
        });
        return () => unsubscribe();
    }, [communityId]);
    
    useEffect(() => {
        if (!communityId || !firestore) return;
        setIsCreationsLoading(true);
        const creationsQuery = query(collection(firestore, `communities/${communityId}/creations`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(creationsQuery, 
            (snapshot) => {
                const creationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creation));
                setCreations(creationsData);
                setIsCreationsLoading(false);
            }, 
            (err) => {
                const permissionError = new FirestorePermissionError({
                    path: `communities/${communityId}/creations`,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setCreationsError(err);
                setIsCreationsLoading(false);
            }
        );
        return () => unsubscribe();
    }, [communityId]);
    
    const sortedCreations = useMemo(() => {
        if (!creations) return [];
        return [...creations].sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    }, [creations]);

    const publishedCreations = useMemo(() => sortedCreations.filter(c => c.status === 'published'), [sortedCreations]);
    const workshopCreations = useMemo(() => sortedCreations.filter(c => c.status === 'in-workshop'), [sortedCreations]);

    const isLoading = isUserLoading || isCommunityLoading || isCreationsLoading;

    if (isLoading) {
        return (
          <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
            <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
          </main>
        );
    }
    
    if (!community) {
         return (
             <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
                <Card className="w-full max-w-lg text-center">
                  <CardHeader>
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="mt-4">Community Not Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      This community could not be found.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/community">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Community Federation
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
            </main>
        );
    }
    
    return (
        <main className="container mx-auto max-w-6xl py-8">
             <div className="mb-4">
                <Button asChild variant="ghost">
                    <Link href={`/community/${communityId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to {community.name}
                    </Link>
                </Button>
            </div>
            
            <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
                    <Banknote /> {community.name} Treasury
                </h1>
                <p className="text-lg text-muted-foreground mt-2">A complete archive of all creations from this community.</p>
            </div>
            
            {creationsError && (
                 <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            )}

            <div className="space-y-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Published Creations</CardTitle>
                        <CardDescription>Creations visible to the entire federation in the public museum.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {publishedCreations.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {publishedCreations.map(creation => (
                                    <CreationCard key={creation.id} creation={creation} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No creations have been published yet.</p>
                        )}
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>In-Workshop Creations</CardTitle>
                        <CardDescription>Creations currently in the private workshop, visible only to members.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {workshopCreations.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {workshopCreations.map(creation => (
                                    <CreationCard key={creation.id} creation={creation} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">The workshop is currently empty.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

        </main>
    )
}


function CreationCard({ creation }: { creation: Creation }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="overflow-hidden cursor-pointer group">
                    <div className="aspect-square bg-muted">
                        <Svg3dCube pixels={creation.pixels} />
                    </div>
                    <CardHeader className="p-4">
                        <CardTitle className="text-base line-clamp-1 group-hover:underline">{creation.prompt}</CardTitle>
                        <CardDescription className="text-xs">by {creation.creatorName}</CardDescription>
                    </CardHeader>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{creation.prompt}</DialogTitle>
                    <DialogDescription>
                        Created by {creation.creatorName} on {new Date(creation.createdAt.seconds * 1000).toLocaleDateString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="aspect-square bg-muted rounded-md my-4">
                    <Svg3dCube pixels={creation.pixels} />
                </div>
                <SaveToTreasuryForm creation={creation} />
            </DialogContent>
        </Dialog>
    );
}
