
// src/components/community/PresentationHall.tsx
'use client';

import { useState, useEffect } from 'react';
import { firestore } from '@/firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, Presentation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Svg3dCube } from '@/components/icons/svg3d-cube';
import { SaveToTreasuryForm } from './SaveToTreasuryForm';
import { useTranslation } from '@/hooks/use-translation';

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

export function PresentationHall({ communityId }: { communityId: string }) {
    const [creations, setCreations] = useState<Creation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (!firestore || !communityId) return;
        const fetchCreations = async () => {
            setIsLoading(true);
            try {
                const q = query(collection(firestore, `communities/${communityId}/creations`), where('status', '==', 'published'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const creationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creation));
                setCreations(creationsData);
            } catch (e) {
                setError(e as Error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCreations();
    }, [communityId]);
    
    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!creations || creations.length === 0) {
        return null; // Don't render the hall if it's empty
    }

    return (
        <div className="mb-12">
            <Card className="shadow-lg bg-gradient-to-br from-primary/10 via-card to-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-3xl font-headline text-primary"><Presentation /> {t('community_page_presentation_hall_title')}</CardTitle>
                    <CardDescription>{t('community_page_presentation_hall_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-destructive text-center">{t('community_page_load_creations_error', { message: error.message })}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {creations.map(creation => (
                            <Dialog key={creation.id}>
                                <DialogTrigger asChild>
                                    <Card className="overflow-hidden cursor-pointer group">
                                        <div className="aspect-square bg-muted">
                                            <Svg3dCube pixels={creation.pixels} />
                                        </div>
                                        <CardHeader className="p-4">
                                            <CardTitle className="text-base line-clamp-1 group-hover:underline">{creation.prompt}</CardTitle>
                                            <CardDescription className="text-xs">{t('community_page_by_creator', { name: creation.creatorName })}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>{creation.prompt}</DialogTitle>
                                        <DialogDescription>
                                            {t('community_page_created_by', { name: creation.creatorName, date: new Date(creation.createdAt.seconds * 1000).toLocaleDateString() })}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="aspect-square bg-muted rounded-md my-4">
                                        <Svg3dCube pixels={creation.pixels} />
                                    </div>
                                    <SaveToTreasuryForm creation={creation} />
                                </DialogContent>
                            </Dialog>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
