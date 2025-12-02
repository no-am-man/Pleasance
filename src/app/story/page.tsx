
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
import { useUser } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
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
};


function StoryHistory({ onSelectStory }: { onSelectStory: (story: Story) => void; }) {
    const { user, isUserLoading } = useUser();

    const storiesQuery = useMemo(() => user ? query(collection(firestore, 'users', user.uid, 'stories'), orderBy('createdAt', 'desc')) : null, [user]);
    const [stories, isLoading, error] = useCollectionData<Story>(storiesQuery, {
      idField: 'id'
    });

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
                <CardTitle className="flex items-center gap-2 text-2xl font-serif"><History /> Your Storybook</CardTitle>
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
        <DialogTitle>Snapshot from {snapshot.createdAt ? new Date(snapshot.createdAt.seconds * 1000).toLocaleString() : 'a past time'}</DialogTitle>
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

    const snapshotsQuery = useMemo(() => user ? query(collection(firestore, 'users', user.uid, 'historySnapshots'), orderBy('createdAt', 'desc')) : null, [user]);
    const [snapshots, isLoading, error] = useCollectionData<HistorySnapshot>(snapshotsQuery, {
      idField: 'id'
    });

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
        if (!user) return;
        const docRef = doc(firestore, `users/${user.uid}/historySnapshots/${snapshotId}`);
        await deleteDoc(docRef);
        toast({ title: 'Snapshot Deleted' });
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
  
  const profileDocRef = useMemo(() => user ? doc(firestore, 'community-profiles', user.uid) : null, [user]);
  const [profile, isProfileLoading] = useDocumentData<CommunityProfile>(profileDocRef);

  const form = useForm<z.infer<typeof StoryFormSchema>>({
    resolver: zodResolver(StoryFormSchema),
    defaultValues: {
      difficulty: 'beginner',
      sourceLanguage: profile?.nativeLanguage,
      targetLanguage: profile?.learningLanguage,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        difficulty: form.getValues('difficulty'),
        sourceLanguage: profile.nativeLanguage,
        targetLanguage: profile.learningLanguage,
      });
    }
  }, [profile, form]);

  useEffect(() => {
    if (activeStory && storyViewerRef.current) {
      storyViewerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeStory]);


  async function onSubmit(data: z.infer<typeof StoryFormSchema>) {
    if (!user) {
        setError("You must be logged in to generate a story.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setActiveStory(null);

    const result = await generateStoryAndSpeech({ ...data, userId: user.uid });

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
    <main className="container mx-auto max-w-4xl py-8">
      <div 
        className="text-center mb-12 p-8 rounded-lg"
        style={{
            background: 'radial-gradient(circle, rgba(10,40,60,1) 0%, rgba(0,20,40,1) 100%)',
            border: '2px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 20px rgba(255,215,0,0.2)'
        }}>
        <h1 className="text-5xl font-serif font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <BookOpen className="w-12 h-12" /> Nuncy Lingua
        </h1>
        <p className="text-lg text-slate-300 mt-2">
          Generate a short story at your level, then practice with our karaoke-style player.
        </p>
      </div>
      
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

      {!user ? (
         <Card className="w-full max-w-md mx-auto text-center shadow-lg bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Welcome to the Language Lab</CardTitle>
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
        <div className="space-y-8">
            <Card 
                className="shadow-2xl"
                style={{
                    backgroundImage: "url('/chalkboard.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '4px solid #6b4a39'
                }}>
                <CardHeader className="text-white">
                    <CardTitle className="text-3xl font-serif flex items-center gap-2"><PencilRuler/> New Lesson</CardTitle>
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
                            <FormLabel className="text-white font-serif">Your Language</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white font-sans">
                                    <SelectValue placeholder="Select your language" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-800 text-white border-slate-600 font-sans">
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
                            <FormLabel className="text-white font-serif">Language to Learn</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white font-sans">
                                    <SelectValue placeholder="Select a language" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-800 text-white border-slate-600 font-sans">
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
                            <FormLabel className="text-white font-serif">Difficulty</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white font-sans">
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-800 text-white border-slate-600 font-sans">
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
                    <Button type="submit" disabled={isLoading} size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold font-sans">
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
            
            <Separator />

            <StoryHistory onSelectStory={handleSelectStoryFromHistory} />
            
            <Separator />

            <TimeMachine />
        </div>
      )}
    </main>
  );
}
