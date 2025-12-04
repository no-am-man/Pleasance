
// src/app/story/page.tsx
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle, Sparkles, LogIn, History, BookOpen, PencilRuler, Camera, Clock } from 'lucide-react';
import { LANGUAGES } from '@/config/languages';
import { generateStoryAndSpeech, createHistorySnapshot } from '@/app/actions';
import StoryViewer from '@/components/story-viewer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser, useMemoFirebase } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, orderBy, doc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import Leaderboard from '@/components/leaderboard';

const StoryFormSchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceLanguage: z.string({ required_error: 'Please select a source language.' }),
  targetLanguage: z.string({ required_error: 'Please select a target language.' }),
});

type Story = {
    id: string;
    userId: string;
    level: string;
    sourceLanguage: string;
    targetLanguage: string;
    nativeText: string;
    translatedText: string;
    createdAt: { seconds: number; nanoseconds: number; } | null;
    audioUrl?: string; 
    status?: 'processing' | 'complete' | 'failed';
};

type HistorySnapshot = {
    id: string;
    userId: string;
    createdAt: { seconds: number; nanoseconds: number; } | null;
    storyCount: number;
    stories: Story[];
};

type CommunityProfile = {
    nativeLanguage: string;
    learningLanguage: string;
    avatarUrl?: string;
};


function StoryHistory({ onSelectStory }: { onSelectStory: (story: Story) => void; }) {
    const { user, isUserLoading } = useUser();
    
    const [stories, setStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user || !firestore) {
            setIsLoading(false);
            return;
        }

        const fetchStories = async () => {
            try {
                const storiesQuery = query(collection(firestore, 'users', user.uid, 'stories'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(storiesQuery);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
                setStories(data);
            } catch (err: any) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStories();
    }, [user]);


    if (isUserLoading) {
      return (
          <div className="flex justify-center p-4">
              <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
          </div>
      );
    }
    
    if (!user) return null;

    return (
        <Card className="shadow-lg bg-background/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-headline"><History /> Your Story History</CardTitle>
                <CardDescription>Revisit stories you've generated in the past.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <LoaderCircle className="animate-spin mx-auto" />}
                {error && <p className="text-destructive">Error loading history: {error.message}</p>}
                {stories && stories.length === 0 && <p className="text-muted-foreground text-center">You haven't generated any stories yet.</p>}
                {stories && stories.length > 0 && (
                    <ul className="space-y-2 max-h-80 overflow-y-auto">
                        {stories.map((story, index) => (
                            <li key={`${story.id}-${index}`}>
                                <button 
                                    onClick={() => onSelectStory(story)}
                                    className="w-full text-left p-3 rounded-md hover:bg-accent/20 transition-colors border-b border-border/50"
                                >
                                    <p className="font-semibold truncate">{story.nativeText}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {story.level} &middot; {story.sourceLanguage} to {story.targetLanguage} &middot; {story.createdAt ? new Date(story.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                    </p>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

function SnapshotViewer({ snapshot }: { snapshot: HistorySnapshot }) {
  return (
    <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Story Snapshot from {snapshot.createdAt ? new Date(snapshot.createdAt.seconds * 1000).toLocaleString() : 'a past time'}</DialogTitle>
        <DialogDescription>
          A view of your {snapshot.storyCount} stories from this point in time.
        </DialogDescription>
      </DialogHeader>
      <div className="flex-grow overflow-y-auto pr-4 space-y-4">
        {snapshot.stories.map((story, index) => (
          <Card key={`${story.id}-${index}`} className="bg-muted/50">
            <CardHeader>
                <CardTitle className="text-base">{story.nativeText.substring(0, 100)}...</CardTitle>
                <CardDescription className="text-xs">
                    {story.level} &middot; {story.sourceLanguage} to {story.targetLanguage}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">{story.translatedText}</p>
            </CardContent>
          </Card>
        ))}
      </div>
       <DialogClose asChild>
          <Button type="button" variant="secondary">
            Close
          </Button>
        </DialogClose>
    </DialogContent>
  );
}

function TimeMachine() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(false);

    const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user || !firestore) {
            setIsLoading(false);
            return;
        }

        const fetchSnapshots = async () => {
            try {
                const snapshotsQuery = query(collection(firestore, 'users', user.uid, 'historySnapshots'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(snapshotsQuery);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistorySnapshot));
                setSnapshots(data);
            } catch (err: any) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSnapshots();
    }, [user]);

    const handleCreateSnapshot = async () => {
        if (!user) return;
        setIsCreating(true);
        const result = await createHistorySnapshot({ userId: user.uid });
        if (result.error) {
            toast({ variant: 'destructive', title: 'Snapshot Failed', description: result.error });
        } else {
            toast({ title: 'Snapshot Created!', description: `Saved ${result.storyCount} stories to your Time Machine.` });
        }
        setIsCreating(false);
    };
    
    const handleDeleteSnapshot = async (snapshotId: string) => {
        if (!user || !firestore) return;
        const docRef = doc(firestore, `users/${user.uid}/historySnapshots/${snapshotId}`);
        await deleteDoc(docRef);
        toast({ title: 'Snapshot Deleted' });
        setSnapshots(prev => prev.filter(s => s.id !== snapshotId));
    }

    if (isUserLoading) return <LoaderCircle className="w-8 h-8 animate-spin text-primary" />;
    if (!user) return null;

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock /> Time Machine</CardTitle>
                <CardDescription>Create and view snapshots of your story history.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Button onClick={handleCreateSnapshot} disabled={isCreating}>
                    {isCreating ? <LoaderCircle className="mr-2 animate-spin" /> : <Camera className="mr-2" />}
                    Create Snapshot
                </Button>
                <Separator />
                 {isLoading && <LoaderCircle className="animate-spin mx-auto" />}
                 {error && <p className="text-destructive">Error loading snapshots: {error.message}</p>}
                 {snapshots && snapshots.length === 0 && <p className="text-muted-foreground text-center">No snapshots created yet.</p>}
                 {snapshots && snapshots.length > 0 && (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {snapshots.map(snapshot => (
                            <Dialog key={snapshot.id}>
                                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                                    <DialogTrigger asChild>
                                        <button className="flex-grow text-left">
                                            <p className="font-semibold">{snapshot.createdAt ? new Date(snapshot.createdAt.seconds * 1000).toLocaleString() : 'Snapshot'}</p>
                                            <p className="text-sm text-muted-foreground">{snapshot.storyCount} stories captured</p>
                                        </button>
                                    </DialogTrigger>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSnapshot(snapshot.id)}>Delete</Button>
                                </div>
                                <SnapshotViewer snapshot={snapshot} />
                            </Dialog>
                        ))}
                    </div>
                 )}
            </CardContent>
        </Card>
    )
}

export default function StoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const storyViewerRef = useRef<HTMLDivElement>(null);
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const form = useForm<z.infer<typeof StoryFormSchema>>({
    resolver: zodResolver(StoryFormSchema),
    defaultValues: {
      difficulty: 'beginner',
    },
  });

  useEffect(() => {
    if (!user || isUserLoading) {
      setIsProfileLoading(false);
      return;
    }
    const fetchProfile = async () => {
        setIsProfileLoading(true);
        const profileDocRef = doc(firestore, 'community-profiles', user.uid);
        const docSnap = await getDoc(profileDocRef);
        if (docSnap.exists()) {
            const profileData = docSnap.data() as CommunityProfile;
            setProfile(profileData);
            form.reset({
                difficulty: form.getValues('difficulty') || 'beginner',
                sourceLanguage: profileData.nativeLanguage,
                targetLanguage: profileData.learningLanguage,
            });
        }
        setIsProfileLoading(false);
    };
    fetchProfile();
  }, [user, isUserLoading, form]);


  useEffect(() => {
    if (activeStory && storyViewerRef.current) {
      storyViewerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeStory]);


  async function onSubmit(data: z.infer<typeof StoryFormSchema>) {
    if (!user || !profile) {
        setError("You must be logged in and have a complete profile to generate a story.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setActiveStory(null);

    const result = await generateStoryAndSpeech({ 
        ...data,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: profile.avatarUrl || user.photoURL || ''
    });

    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    
    if (result.storyData) {
        setActiveStory(result.storyData as Story);
        toast({ title: "Story Generated!", description: "Your new story is ready."});
    } else {
      setError('An unknown error occurred while generating the story.');
    }
  }

  const handleSelectStoryFromHistory = (story: Story) => {
    setActiveStory(story);
  }

  if (isUserLoading || isProfileLoading) {
    return (
        <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
            <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
        </main>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl py-8">
      <div 
        className="text-center mb-12 p-8 rounded-lg"
        style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.2) 0%, transparent 70%)',
        }}>
        <h1 className="text-5xl font-headline font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <BookOpen className="w-12 h-12" /> Nuncy Lingua
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Generate a short story at your level, then practice with our karaoke-style player.
        </p>
      </div>
      
        {!user ? (
         <Card className="w-full max-w-md mx-auto text-center shadow-lg bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Welcome to the Scriptorium</CardTitle>
            <CardDescription>Log in to generate stories and save your progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login to Continue
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <div ref={storyViewerRef} className="scroll-mt-8">
                    {isLoading && (
                        <div className="flex justify-center p-8">
                            <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
                            <p className="ml-4 text-muted-foreground self-center">Generating your story and audio...</p>
                        </div>
                    )}
                    {error && (
                        <Alert variant="destructive" className="my-8">
                            <AlertTitle>Action Failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {activeStory && (
                        <div className="mb-8">
                            <StoryViewer 
                                key={activeStory.id}
                                story={activeStory}
                                autoplay={true}
                            />
                        </div>
                    )}
                </div>
                 <Card 
                    className="shadow-2xl"
                    style={{
                        backgroundImage: "url('/chalkboard.jpg')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}>
                    <CardHeader className="text-white">
                        <CardTitle className="text-3xl font-headline flex items-center gap-2"><PencilRuler/> New Lesson</CardTitle>
                        <CardDescription className="text-slate-300">Choose your languages and difficulty.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                            control={form.control}
                            name="sourceLanguage"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-white font-headline">Your Language</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white font-body">
                                        <SelectValue placeholder="Select your language" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 text-white border-slate-600 font-body">
                                    {LANGUAGES.map((lang) => (
                                        <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="targetLanguage"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-white font-headline">Language to Learn</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white font-body">
                                        <SelectValue placeholder="Select a language" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 text-white border-slate-600 font-body">
                                    {LANGUAGES.map((lang) => (
                                        <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                            />
                             <FormField
                            control={form.control}
                            name="difficulty"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-white font-headline">Difficulty</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white font-body">
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 text-white border-slate-600 font-body">
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                            />
                        </div>
                        <Button type="submit" disabled={isLoading} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-body">
                            {isLoading ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Generate Story
                        </Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
                 <Leaderboard />
                 <StoryHistory onSelectStory={handleSelectStoryFromHistory} />
                 <TimeMachine />
            </div>
        </div>
      )}
    </main>
  );
}
