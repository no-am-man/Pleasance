// src/app/museum/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { firestore } from '@/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, Landmark, Flag, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Svg3dCube } from '@/components/icons/svg3d-cube';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { useTranslation } from '@/hooks/use-translation';
import type { Creation, Community } from '@/lib/types';


function CommunityHall({ community }: { community: Community }) {
    const { t } = useTranslation();
    const [creations, setCreations] = useState<Creation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore) return;
        
        const fetchCreations = async () => {
            try {
                const creationsQuery = query(
                    collection(firestore, `communities/${community.id}/creations`), 
                    where('status', '==', 'published'), 
                    orderBy('createdAt', 'desc')
                );
                const snapshot = await getDocs(creationsQuery);
                const creationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creation));
                setCreations(creationsData);
            } catch (err: any) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCreations();
    }, [community.id]);


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
                            <Image src={community.flagUrl} alt={`${community.name} Flag`} fill style={{ objectFit: 'cover' }} className="rounded-md" />
                        ) : (
                            <Flag className="h-8 w-8 text-muted-foreground" />
                        )}
                         <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs p-1">{t('museum_view_community')}</div>
                    </Link>
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
                            <Link href={`/community/${community.id}`} className="hover:underline">{community.name}</Link>
                        </CardTitle>
                        <CardDescription>{community.description}</CardDescription>
                    </div>
                 </CardHeader>
                <CardContent>
                    {error && <p className="text-destructive text-center">{t('community_page_load_creations_error', { message: error.message })}</p>}
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
                                            <CardDescription className="text-xs">{t('museum_by_creator', { name: creation.creatorName })}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>{creation.prompt}</DialogTitle>
                                        <DialogDescription>
                                            {t('museum_created_by', { name: creation.creatorName, date: new Date(creation.createdAt.seconds * 1000).toLocaleDateString() })}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="aspect-square bg-muted rounded-md my-4">
                                        <Svg3dCube pixels={creation.pixels} />
                                    </div>
                                    
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
    const { t } = useTranslation();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore) return;

        const fetchCommunities = async () => {
            try {
                const communitiesQuery = query(collection(firestore, 'communities'), orderBy('name', 'asc'));
                const snapshot = await getDocs(communitiesQuery);
                const communityData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
                setCommunities(communityData);
            } catch (err: any) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCommunities();
    }, []);


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
                        <CardTitle className="mt-4">{t('museum_error_title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                           {t('museum_error_desc')}
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
                    <Landmark className="w-10 h-10" /> {t('museum_title')}
                </h1>
                <p className="text-lg text-muted-foreground mt-2">{t('museum_subtitle')}</p>
            </div>
            
            <Card className="mb-12 text-center border-primary/20">
                <CardHeader>
                    <CardTitle>{t('museum_future_title')}</CardTitle>
                    <CardDescription>
                        {t('museum_future_desc_1')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        {t('museum_future_desc_2')}
                    </p>
                    <Button asChild>
                        <Link href="https://lashirilo.com" target="_blank" rel="noopener noreferrer">
                             <ExternalLink className="mr-2 h-4 w-4" />
                            {t('museum_future_cta')}
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <div className="space-y-12">
                {communities && communities.length > 0 ? (
                    communities.map(community => (
                        <CommunityHall key={community.id} community={community} />
                    ))
                ) : (
                    <Card className="text-center py-16">
                        <CardHeader>
                            <CardTitle>{t('museum_empty_title')}</CardTitle>
                            <CardDescription>{t('museum_empty_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/community">
                                    {t('exploreCommunities')}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}
