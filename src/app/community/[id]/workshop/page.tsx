// src/app/community/[id]/workshop/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc, collection, query, where, orderBy, updateDoc, onSnapshot, Unsubscribe, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, ArrowLeft, Sparkles, Save, Download, Share, Paintbrush } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useRef, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { generateSvg3dAction, saveSvgAssetAction } from '@/app/actions';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Svg3dCube } from '@/components/icons/svg3d-cube';
import { formatDistanceToNow } from 'date-fns';
import { GenerateSvg3dInputSchema, type ColorPixel } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { SatoshiIcon } from '@/components/icons/satoshi-icon';
import { addDocument } from '@/firebase/db-updates';
import { SaveToTreasuryForm } from '@/components/community/SaveToTreasuryForm';

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
  flagUrl?: string;
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

const Svg3dSchema = GenerateSvg3dInputSchema;

export default function CommunityWorkshopPage() {
    const params = useParams();
    const router = useRouter();
    const communityId = Array.isArray(params.id) ? params.id[0] : params.id;
  
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
    const { user } = useUser();
    const { toast } = useToast();

    const [community, setCommunity] = useState<Community | null>(null);
    const [isCommunityLoading, setIsCommunityLoading] = useState(true);

    const [creations, setCreations] = useState<Creation[]>([]);
    const [isCreationsLoading, setIsCreationsLoading] = useState(true);
    const [creationsError, setCreationsError] = useState<Error | null>(null);
    
    const isOwner = user?.uid === community?.ownerId;

    useEffect(() => {
        if (!communityId || !firestore) return;
        setIsCommunityLoading(true);
        const communityDocRef = doc(firestore, 'communities', communityId);
        const unsubscribe = onSnapshot(communityDocRef, (doc) => {
            setCommunity(doc.exists() ? doc.data() as Community : null);
            setIsCommunityLoading(false);
        }, (err) => {
            setError(err.message);
            setIsCommunityLoading(false);
        });
        return () => unsubscribe();
    }, [communityId]);

    useEffect(() => {
        if (!communityId || !firestore) return;
        setIsCreationsLoading(true);
        const workshopCreationsQuery = query(collection(firestore, `communities/${communityId}/creations`), where('status', '==', 'in-workshop'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(workshopCreationsQuery, 
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


    useEffect(() => {
        if (!activeCreation && sortedCreations && sortedCreations.length > 0) {
            setActiveCreation(sortedCreations[0]);
        }
    }, [sortedCreations, activeCreation]);

    const form = useForm<z.infer<typeof Svg3dSchema>>({
        resolver: zodResolver(Svg3dSchema),
        defaultValues: {
            prompt: '',
            cubeSize: 100,
            density: 'medium',
        },
    });
    
    const handlePublish = async (creationId: string) => {
        if (!isOwner || !communityId) return;
        const creationRef = doc(firestore, `communities/${communityId}/creations`, creationId);
        await updateDoc(creationRef, { status: 'published' });
        toast({ title: 'Creation Published!', description: 'The artwork is now visible in the Presentation Hall.' });
    };


    async function onSubmit(data: z.infer<typeof Svg3dSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: 'Login Required', description: 'You must be logged in to create artwork.' });
            return;
        }
        if (!communityId) {
             setError(`Community ID is missing.`);
             return;
        }
        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateSvg3dAction(data);

            const creationData = {
              pixels: result.pixels,
              prompt: data.prompt,
              creatorId: user.uid,
              creatorName: user.displayName || 'Anonymous',
              creatorAvatarUrl: user.photoURL || '',
              status: 'in-workshop' as const,
              createdAt: serverTimestamp(),
            };

            const newCreationRef = await addDocument(collection(firestore, `communities/${communityId}/creations`), creationData);
            
            setActiveCreation({ ...creationData, id: newCreationRef.id, createdAt: { seconds: Date.now()/1000, nanoseconds: 0 }});

            toast({ title: 'Creation Added!', description: 'Your vision has been added to the gallery.' });
            form.reset({ ...form.getValues(), prompt: '' });

        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
            setError(`Generation failed: ${message}`);
        }

        setIsGenerating(false);
    }
    
    if (isCommunityLoading) {
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
                      This community could not be found. It may have been moved or deleted.
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
                <Paintbrush /> {community.name} Workshop
                </h1>
                <p className="text-lg text-muted-foreground mt-2">A private creative space for community members.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle>Channel a New Creation</CardTitle>
                            <CardDescription className="flex items-center gap-1.5 pt-2">
                                Each creation is valued at 1 <SatoshiIcon className="w-4 h-4" />.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="prompt"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Vision</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., 'The birth of a star'" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="cubeSize"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cube Size</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="density"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Density</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select density" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                            <Button type="submit" disabled={isGenerating} className="w-full">
                                {isGenerating ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Channeling...</> : <><Sparkles className="mr-2 h-4 w-4" /> Create</> }
                            </Button>
                            </form>
                        </Form>
                        </CardContent>
                    </Card>
                    {activeCreation && <SaveToTreasuryForm creation={activeCreation} />}
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                         <CardHeader>
                            {activeCreation && (
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={activeCreation.creatorAvatarUrl || `https://i.pravatar.cc/150?u=${activeCreation.creatorId}`} />
                                        <AvatarFallback>{activeCreation.creatorName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-xl">{activeCreation.prompt}</CardTitle>
                                        <CardDescription>
                                            Created by {activeCreation.creatorName} {activeCreation.createdAt && formatDistanceToNow(new Date(activeCreation.createdAt.seconds * 1000), { addSuffix: true })}
                                        </CardDescription>
                                    </div>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-2 aspect-square">
                            <div className="w-full h-full bg-muted rounded-md">
                                {isGenerating || isCreationsLoading ? (
                                    <div className="flex w-full h-full justify-center items-center p-8"> <LoaderCircle className="w-12 h-12 animate-spin text-primary" /> </div>
                                ) : error ? (
                                    <div className="flex w-full h-full justify-center items-center p-4"> <Alert variant="destructive"> <AlertTitle>Generation Failed</AlertTitle> <AlertDescription>{error}</AlertDescription> </Alert> </div>
                                ) : activeCreation ? (
                                    <Svg3dCube pixels={activeCreation.pixels} />
                                ) : (
                                    <div className="flex w-full h-full flex-col gap-4 justify-center items-center text-center text-muted-foreground p-4"> <Svg3dCube pixels={[]} className="w-16 h-16" /> <p dangerouslySetInnerHTML={{ __html: "Your generated 3D art will appear here. <br/> Click and drag to rotate."}} /> </div>
                                )}
                            </div>
                        </CardContent>
                         {isOwner && activeCreation && (
                            <CardFooter className="p-2">
                                <Button onClick={() => handlePublish(activeCreation.id)} size="sm" className="w-full">
                                    <Share className="mr-2 h-4 w-4" /> Publish to Presentation Hall
                                </Button>
                            </CardFooter>
                        )}
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Workshop Feed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isCreationsLoading && <div className="flex justify-center p-4"><LoaderCircle className="w-8 h-8 animate-spin text-primary" /></div>}
                            {creationsError && <p className="text-destructive text-center">Error loading gallery: {creationsError.message}</p>}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {sortedCreations?.map(creation => (
                                    <button key={creation.id} onClick={() => setActiveCreation(creation)} className="relative aspect-square block border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary rounded-lg overflow-hidden group">
                                        <div className="w-full h-full bg-muted">
                                        <Svg3dCube pixels={creation.pixels} />
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center text-white">
                                            <p className="text-xs font-bold line-clamp-2">{creation.prompt}</p>
                                        </div>
                                        {activeCreation?.id === creation.id && (
                                            <div className="absolute inset-0 border-4 border-primary rounded-md pointer-events-none" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
             </div>
        </main>
    );
}
