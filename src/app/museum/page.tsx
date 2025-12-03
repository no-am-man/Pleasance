// src/app/museum/page.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useUser, useMemoFirebase } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, where, orderBy, doc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, Landmark, Flag } from 'lucide-react';
import Link from 'next/link';
import { Svg3dCube } from '@/components/icons/svg3d-cube';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import Image from 'next/image';

// Types from lib/types.ts or similar
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

type Community = {
  id: string;
  name: string;
  description: string;
  flagUrl?: string;
};

function CommunityHall({ community }: { community: Community }) {
    const creationsQuery = useMemoFirebase(() => 
        query(
            collection(firestore, `communities/${community.id}/creations`), 
            where('status', '==', 'published'), 
            orderBy('createdAt', 'desc')
        ), 
        [community.id]
    );

    const [creations, setCreations] = useState<Creation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!creationsQuery) {
            setIsLoading(false);
            return;
        }
        const unsubscribe = onSnapshot(creationsQuery, (snapshot) => {
            const creationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creation));
            setCreations(creationsData);
            setIsLoading(false);
        }, setError);
        return () => unsubscribe();
    }, [creationsQuery]);


    if (isLoading) {
        return (
            <Card className="bg-muted/30">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                        <CardTitle className="text-xl text-muted-foreground">{community.name}</CardTitle>
                    </div>
                </CardHeader>
            </Card>
        );
    }
    
    if (error || !creations || creations.length === 0) {
        return null; // Don't render the hall if there's an error or no creations
    }

    return (
        <section className="mb-12">
            <Card className="shadow-lg bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
                 <CardHeader className="flex flex-row items-center gap-4">
                     <Link href={`/community/${community.id}`} className="relative h-20 w-36 flex-shrink-0 rounded-md border bg-muted flex items-center justify-center group">
                        {community.flagUrl ? (
                            <Image src={community.flagUrl} alt={`${community.name} Flag`} layout="fill" objectFit="cover" className="rounded-md" />
                        ) : (
                            <Flag className="h-8 w-8 text-muted-foreground" />
                        )}
                         <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs p-1">View Community</div>
                    </Link>
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
                            <Link href={`/community/${community.id}`} className="hover:underline">{community.name}</Link>
                        </CardTitle>
                        <CardDescription>{community.description}</CardDescription>
                    </div>
                 </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {creations.map(creation => (
                            <Dialog key={creation.id}>
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
                                    {/* Removed SaveToTreasuryForm as it's not needed here */}
                                </DialogContent>
                            </Dialog>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}


export default function MuseumPage() {
    const communitiesQuery = useMemoFirebase(() => query(collection(firestore, 'communities'), orderBy('name', 'asc')), []);
    
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!communitiesQuery) {
            setIsLoading(false);
            return;
        }
        const unsubscribe = onSnapshot(communitiesQuery, (snapshot) => {
            const communityData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
            setCommunities(communityData);
            setIsLoading(false);
        }, setError);
        return () => unsubscribe();
    }, [communitiesQuery]);


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
                        <CardTitle className="mt-4">Error Loading Museum</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            There was a problem loading the communities and their creations.
                        </p>
                        <pre className="mb-4 text-left text-sm bg-muted p-2 rounded-md overflow-x-auto">
                            <code>{error.message}</code>
                        </pre>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="container mx-auto max-w-7xl py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
                    <Landmark className="w-10 h-10" /> Virtual Museum
                </h1>
                <p className="text-lg text-muted-foreground mt-2">A grand hall showcasing the published creations from every community in the federation.</p>
            </div>
            
            <div className="space-y-12">
                {communities && communities.length > 0 ? (
                    communities.map(community => (
                        <CommunityHall key={community.id} community={community} />
                    ))
                ) : (
                    <Card className="text-center py-16">
                        <CardHeader>
                            <CardTitle>The Museum is Quiet</CardTitle>
                            <CardDescription>No communities have published any creations yet.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/community">
                                    Explore Communities
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}
