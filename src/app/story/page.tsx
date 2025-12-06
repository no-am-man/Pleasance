// src/app/story/page.tsx
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle, Sparkles, LogIn, History, BookOpen, PencilRuler, Camera, Clock, X } from 'lucide-react';
import { LANGUAGES } from '@/config/languages';
import { generateDualStoryAction, createHistorySnapshot } from '@/app/actions';
import StoryViewer from '@/components/story-viewer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@/firebase';
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
import { useTranslation } from '@/hooks/use-translation';
import { StorySchema as StoryDataTypeSchema, type StorySchema as StoryDataType } from '@/lib/types';

const StoryFormSchema = z.object({
  prompt: z.string().min(3, "Please enter a theme or idea for your story."),
  targetLanguage: z.string({ required_error: 'Please select a language to learn.' }),
});

type CommunityProfile = {
    nativeLanguage: string;
    learningLanguage: string;
};


function StoryHistory({ onSelectStory, onClearStory }: { onSelectStory: (story: StoryDataType) => void; onClearStory: () => void; }) {
    const { user } = useUser();
    const { t } = useTranslation();
    
    const [stories, setStories] = useState<StoryDataType[]>([]);
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
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoryDataType));
                setStories(data);
            } catch (err: any) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStories();
    }, [user]);
    
    const handleSelect = (story: StoryDataType) => {
        onClearStory(); // Clear any existing story first
        setTimeout(() => onSelectStory(story), 50); // Then select the new one
    };


    if (!user) return null;

    return (
        <Card className="shadow-lg bg-background/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-headline"><History /> {t('story_history_title')}</CardTitle>
                <CardDescription>{t('story_history_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <LoaderCircle className="animate-spin mx-auto" />}
                {error && <p className="text-destructive">Error loading history: {error.message}</p>}
                {stories && stories.length === 0 && <p className="text-muted-foreground text-center">{t('story_history_empty')}</p>}
                {stories && stories.length > 0 && (
                    <ul className="space-y-2 max-h-80 overflow-y-auto">
                        {stories.map((story, index) => (
                            <li key={`${story.id}-${index}`}>
                                <button 
                                    onClick={() => handleSelect(story)}
                                    className="w-full text-left p-3 rounded-md hover:bg-accent/20 transition-colors border-b border-border/50"
                                >
                                    <p className="font-semibold truncate">{story.titleOriginal}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {story.targetLanguage} &middot; {story.createdAt ? new Date(story.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
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
  const { t } = useTranslation();
  return (
    <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{t('snapshot_title', { date: snapshot.createdAt ? new Date(snapshot.createdAt.seconds * 1000).toLocaleString() : 'a past time' })}</DialogTitle>
        <DialogDescription>
          {t('snapshot_desc', { count: snapshot.storyCount })}
        </DialogDescription>
      </DialogHeader>
      <div className="flex-grow overflow-y-auto pr-4 space-y-4">
        {snapshot.stories.map((story, index) => (
          <Card key={`${story.titleOriginal}-${index}`} className="bg-muted/50">
            <CardHeader>
                <CardTitle className="text-base">{story.titleOriginal}</CardTitle>
                <CardDescription className="text-xs">
                    {story.targetLanguage}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">{story.contentTranslated}</p>
            </CardContent>
          </Card>
        ))}
      </div>
       <DialogClose asChild>
          <Button type="button" variant="secondary">
            {t('snapshot_close')}
          </Button>
        </DialogClose>
    </DialogContent>
  );
}

type HistorySnapshot = {
    id: string;
    userId: string;
    createdAt: { seconds: number; nanoseconds: number; } | null;
    storyCount: number;
    stories: StoryDataType[];
};


function TimeMachine() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const { t } = useTranslation();
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
            toast({ variant: 'destructive', title: t('toast_snapshot_failed_title'), description: result.error });
        } else {
            toast({ title: t('toast_snapshot_created_title'), description: t('toast_snapshot_created_desc', { count: result.storyCount }) });
        }
        setIsCreating(false);
    };
    
    const handleDeleteSnapshot = async (snapshotId: string) => {
        if (!user || !firestore) return;
        const docRef = doc(firestore, `users/${user.uid}/historySnapshots/${snapshotId}`);
        await deleteDoc(docRef);
        toast({ title: t('toast_snapshot_deleted_title') });
        setSnapshots(prev => prev.filter(s => s.id !== snapshotId));
    }

    if (isUserLoading) return <LoaderCircle className="w-8 h-8 animate-spin text-primary" />;
    if (!user) return null;

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock /> {t('time_machine_title')}</CardTitle>
                <CardDescription>{t('time_machine_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Button onClick={handleCreateSnapshot} disabled={isCreating}>
                    {isCreating ? <LoaderCircle className="mr-2 animate-spin" /> : <Camera className="mr-2" />}
                    {t('time_machine_create_button')}
                </Button>
                <Separator />
                 {isLoading && <LoaderCircle className="animate-spin mx-auto" />}
                 {error && <p className="text-destructive">{t('time_machine_error', { message: error.message })}</p>}
                 {snapshots && snapshots.length === 0 && <p className="text-muted-foreground text-center">{t('time_machine_empty')}</p>}
                 {snapshots && snapshots.length > 0 && (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {snapshots.map(snapshot => (
                            <Dialog key={snapshot.id}>
                                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                                    <DialogTrigger asChild>
                                        <button className="flex-grow text-left">
                                            <p className="font-semibold">{snapshot.createdAt ? new Date(snapshot.createdAt.seconds * 1000).toLocaleString() : 'Snapshot'}</p>
                                            <p className="text-sm text-muted-foreground">{t('time_machine_stories_captured', { count: snapshot.storyCount })}</p>
                                        </button>
                                    </DialogTrigger>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSnapshot(snapshot.id)}>{t('time_machine_delete_button')}</Button>
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<StoryDataType | null>(null);
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const form = useForm<z.infer<typeof StoryFormSchema>>({
    resolver: zodResolver(StoryFormSchema),
    defaultValues: {
      prompt: '',
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
                prompt: '',
                targetLanguage: profileData.learningLanguage,
            });
        }
        setIsProfileLoading(false);
    };
    fetchProfile();
  }, [user, isUserLoading, form]);


  async function onSubmit(data: z.infer<typeof StoryFormSchema>) {
    if (!user || !profile) {
        setError(t('story_generation_error_profile'));
        return;
    }
    setIsGenerating(true);
    setError(null);
    setActiveStory(null);

    const result = await generateDualStoryAction(data);

    setIsGenerating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    
    // The schema from the action needs to be validated before setting state
    const parsedStory = StoryDataTypeSchema.safeParse(result);

    if (parsedStory.success) {
        setActiveStory(parsedStory.data);
        toast({ title: t('toast_story_generated_title'), description: t('toast_story_generated_desc') });
    } else {
        setError(`The AI returned data in an unexpected format. ${parsedStory.error.message}`);
    }
  }

  const handleSelectStoryFromHistory = (story: StoryDataType) => {
    setActiveStory(story);
  }

  const clearActiveStory = () => {
    setActiveStory(null);
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
          <BookOpen className="w-12 h-12" /> {t('nuncy_lingua_title')}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          {t('nuncy_lingua_subtitle')}
        </p>
      </div>
      
        {!user ? (
         <Card className="w-full max-w-md mx-auto text-center shadow-lg bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t('story_login_card_title')}</CardTitle>
            <CardDescription>{t('story_login_card_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> {t('story_login_card_button')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                {(!activeStory && !isGenerating && !error) && (
                     <Card 
                        className="shadow-2xl"
                        style={{
                            backgroundImage: "url('/chalkboard.jpg')",
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}>
                        <CardHeader className="text-white">
                            <CardTitle className="text-3xl font-headline flex items-center gap-2"><PencilRuler/> {t('story_new_lesson_title')}</CardTitle>
                            <CardDescription className="text-slate-300">{t('story_new_lesson_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                    control={form.control}
                                    name="prompt"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel className="text-white font-headline">Theme / Idea</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., A robot who finds a flower" {...field} className="bg-slate-800/50 border-slate-600 text-white font-body" />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={form.control}
                                    name="targetLanguage"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel className="text-white font-headline">{t('story_form_language_to_learn')}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white font-body">
                                                <SelectValue placeholder={t('story_form_select_a_language')} />
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
                                </div>
                                <Button type="submit" disabled={isGenerating} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-body">
                                    {isGenerating ? (
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="mr-2 h-4 w-4" />
                                    )}
                                    {t('story_form_generate_button')}
                                </Button>
                            </form>
                        </Form>
                        </CardContent>
                    </Card>
                )}
                
                {isGenerating && (
                    <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted min-h-[300px]">
                        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
                        <p className="ml-4 mt-4 text-muted-foreground self-center">{t('story_generating_message')}</p>
                    </div>
                )}
                {error && (
                    <Alert variant="destructive" className="my-8">
                        <AlertTitle>{t('story_generation_failed_title')}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {activeStory && (
                    <div className="mb-8 relative">
                        <StoryViewer 
                            key={activeStory.titleOriginal}
                            story={activeStory}
                            autoplay={true}
                        />
                        <Button variant="ghost" size="icon" className="absolute top-0 right-0 m-2" onClick={clearActiveStory}>
                            <X />
                        </Button>
                    </div>
                )}

            </div>
            <div className="lg:col-span-1 space-y-8">
                 <Leaderboard />
                 <StoryHistory onSelectStory={handleSelectStoryFromHistory} onClearStory={clearActiveStory} />
                 <TimeMachine />
            </div>
        </div>
      )}
    </main>
  );
}
