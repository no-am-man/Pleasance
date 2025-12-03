
// src/app/workshop/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoaderCircle, Sparkles, Save, Beaker, Users, LogIn, Download, Book } from 'lucide-react';
import { generateSvg3d as generateSvg3dAction, saveSvgAsset } from '@/app/actions';
import { GenerateSvg3dInputSchema, type ColorPixel } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Svg3dCube } from '@/components/icons/svg3d-cube';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { firestore } from '@/firebase/config';
import { doc, collection, setDoc, deleteDoc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { useDocumentData, useCollectionData } from 'react-firebase-hooks/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

// Schemas and Types
const Svg3dSchema = GenerateSvg3dInputSchema;

const SaveAssetSchema = z.object({
    assetName: z.string().min(2, 'Asset name must be at least 2 characters.'),
    value: z.coerce.number().min(0, 'Value must be a positive number.'),
});

type Workshop = {
    id: string;
    latestPrompt?: string;
    pixels?: ColorPixel[];
};

type PresentUser = {
    userId: string;
    name: string;
    avatarUrl?: string;
    lastSeen: any;
};

const WORKSHOP_ID = 'global_3d_workshop';


// Custom hook for managing presence
function usePresence(workshopId: string) {
    const { user } = useUser();
    const presenceRef = useMemo(() => user ? doc(firestore, `workshops/${workshopId}/present_users`, user.uid) : null, [user, workshopId]);

    useEffect(() => {
        if (!presenceRef || !user) return;

        // Set presence when user enters
        setDoc(presenceRef, {
            userId: user.uid,
            name: user.displayName,
            avatarUrl: user.photoURL,
            lastSeen: serverTimestamp()
        });
        
        // Remove presence when user leaves
        return () => {
            deleteDoc(presenceRef);
        };

    }, [presenceRef, user]);
}

// Header component to show present users
function PresenceHeader({ workshopId }: { workshopId: string }) {
    const cutoffDate = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
    
    const presentUsersQuery = useMemo(() =>
        query(
            collection(firestore, `workshops/${workshopId}/present_users`),
            where('lastSeen', '>', cutoffDate)
        ),
        [workshopId]
    );
    const [presentUsers] = useCollectionData<PresentUser>(presentUsersQuery);

    return (
        <Card className="mb-4 shadow-md">
            <CardHeader className="flex-row items-center justify-between p-3">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Live Participants</CardTitle>
                </div>
                <div className="flex -space-x-2 overflow-hidden">
                    <TooltipProvider>
                        {presentUsers?.map(pUser => (
                            <Tooltip key={pUser.userId}>
                                <TooltipTrigger asChild>
                                    <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                                        <AvatarImage src={pUser.avatarUrl} alt={pUser.name} />
                                        <AvatarFallback>{pUser.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{pUser.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                     {(!presentUsers || presentUsers.length === 0) && (
                        <span className="text-sm text-muted-foreground self-center">You are the only one here.</span>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
}

const convertPixelsToObj = (pixels: ColorPixel[]): string => {
    let objContent = '# 3D Point Cloud generated by the Pleasance Crucible of Creation\n';

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '1 1 1'; // Default to white if parse fails
        const r = parseInt(result[1], 16) / 255;
        const g = parseInt(result[2], 16) / 255;
        const b = parseInt(result[3], 16) / 255;
        return `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}`;
    };

    for (const pixel of pixels) {
        // OBJ format: v x y z r g b
        objContent += `v ${pixel.x.toFixed(4)} ${pixel.y.toFixed(4)} ${pixel.z.toFixed(4)} ${hexToRgb(pixel.color)}\n`;
    }

    return objContent;
};


function SaveToTreasuryForm({ pixels, prompt }: { pixels: ColorPixel[]; prompt: string; }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof SaveAssetSchema>>({
        resolver: zodResolver(SaveAssetSchema),
        defaultValues: { assetName: prompt || '', value: 10 },
    });

    useEffect(() => {
        form.setValue('assetName', prompt);
    }, [prompt, form]);

    async function onSubmit(data: z.infer<typeof SaveAssetSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in to save an asset.' });
            return;
        }
        setIsSaving(true);
        try {
            const result = await saveSvgAsset({
                userId: user.uid,
                assetName: data.assetName,
                value: data.value,
                pixels: pixels,
            });

            if (result.error) {
                throw new Error(result.error);
            }
            toast({
                title: 'Asset Saved!',
                description: `"${data.assetName}" has been added to your Treasury.`,
            });
            form.reset();
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Failed to Save Asset', description: message });
        } finally {
            setIsSaving(false);
        }
    }
    
     const handleDownloadObj = () => {
        const objData = convertPixelsToObj(pixels);
        const blob = new Blob([objData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'creation';
        a.download = `${fileName}.obj`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: 'Downloading .obj file...' });
    };

    if (!user) return null;

    return (
        <Card className="mt-4 bg-muted/50">
            <CardHeader>
                <CardTitle className="text-lg">Export & Save</CardTitle>
                <CardDescription>Download for fabrication or save this creation to your Treasury.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Button onClick={handleDownloadObj} variant="secondary" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download .obj File for Fabrication
                    </Button>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 border-t">
                            <FormField
                                control={form.control}
                                name="assetName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Creation Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., 'Digital Sunrise'" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Creation Value (USD)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="100.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Creation to Treasury
                            </Button>
                        </form>
                    </Form>
                </div>
            </CardContent>
        </Card>
    );
}

export default function WorkshopPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  
  const workshopDocRef = useMemo(() => doc(firestore, 'workshops', WORKSHOP_ID), []);
  const [workshopData, isWorkshopLoading] = useDocumentData<Workshop>(workshopDocRef);
  
  const pixels = workshopData?.pixels ?? null;

  usePresence(WORKSHOP_ID);

  const form = useForm<z.infer<typeof Svg3dSchema>>({
    resolver: zodResolver(Svg3dSchema),
    defaultValues: {
      prompt: workshopData?.latestPrompt || '',
      cubeSize: 100,
      density: 'medium',
    },
  });
  
  useEffect(() => {
    if (workshopData?.latestPrompt) {
        form.setValue('prompt', workshopData.latestPrompt);
    }
  }, [workshopData, form]);

  const loadAssetFromUrl = useCallback(async (assetUrl: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(assetUrl);
      if (!response.ok) throw new Error(`Failed to fetch creation: ${response.statusText}`);
      const data = await response.json();
      if (data.pixels) {
        // Set the loaded pixels in the shared workshop document
        await updateDoc(workshopDocRef, { pixels: data.pixels, latestPrompt: 'Loaded from Treasury' });
        // Remove the query param from the URL
        router.replace('/workshop', undefined);
      } else {
        throw new Error('Invalid creation data format.');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to load creation: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [workshopDocRef, router]);
  
  useEffect(() => {
    const assetUrl = searchParams.get('assetUrl');
    if (assetUrl) {
      loadAssetFromUrl(assetUrl);
    }
  }, [searchParams, loadAssetFromUrl]);

  async function onSubmit(data: z.infer<typeof Svg3dSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateSvg3dAction(data);

      if (result.error) {
        setError(result.error);
      } else if (result.pixels) {
        await updateDoc(workshopDocRef, {
            pixels: result.pixels,
            latestPrompt: data.prompt,
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Generation failed: ${message}`);
    }

    setIsLoading(false);
  }

  if (!user) {
    return (
        <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <CardTitle>Enter the Crucible of Creation</CardTitle>
                    <CardDescription>Log in to collaborate with other members in real-time.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" /> Login to Continue
                    </Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl py-8">
       <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3 font-headline">
          <Beaker className="w-10 h-10" /> Crucible of Creation
        </h1>
        <p className="text-lg text-muted-foreground mt-2">A collaborative space to channel the creative spark.</p>
      </div>

      <PresenceHeader workshopId={WORKSHOP_ID} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>Tool: 3D Point-Cloud Creation</CardTitle>
                <CardDescription>
                    Enter a prompt and watch the AI bring your vision to life for all to witness.
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
                            <Input placeholder="e.g., 'The birth of a star', 'Silent forest morning'" {...field} />
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
                                    <FormLabel>Cube Size (mm)</FormLabel>
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
                                    <FormLabel>Pixel Density</FormLabel>
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

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? (
                        <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Channeling...
                        </>
                        ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" /> Create
                        </>
                        )}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            
            {pixels && pixels.length > 0 && <SaveToTreasuryForm pixels={pixels} prompt={workshopData?.latestPrompt || ''} />}
        </div>
        
        <div className="lg:sticky lg:top-24">
            <Card className="shadow-lg aspect-square">
                <CardContent className="p-2 h-full">
                     <div 
                        className="w-full h-full bg-muted rounded-md"
                    >
                         {(isLoading || isWorkshopLoading) && (
                            <div className="flex w-full h-full justify-center items-center p-8">
                                <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
                            </div>
                        )}

                        {error && (
                            <div className="flex w-full h-full justify-center items-center p-4">
                                <Alert variant="destructive">
                                    <AlertTitle>Generation Failed</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            </div>
                        )}
                        
                        {pixels && (
                            <Svg3dCube pixels={pixels} />
                        )}

                        {!isLoading && !isWorkshopLoading && !error && !pixels && (
                             <div className="flex w-full h-full flex-col gap-4 justify-center items-center text-center text-muted-foreground p-4">
                                <Svg3dCube pixels={[]} className="w-16 h-16" />
                                <p>Your shared creation will appear here. <br/> Click and drag to behold.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </main>
  );
}
