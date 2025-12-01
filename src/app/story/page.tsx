
// src/app/story/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle, Sparkles, LogIn, History } from 'lucide-react';
import { LANGUAGES } from '@/config/languages';
import { generateAndTranslateStory } from '@/app/actions';
import StoryViewer from '@/components/story-viewer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

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
    audioUrl?: string; // audioUrl is now part of the story data
};

type StoryResult = {
    originalStory: string;
    translatedText: string;
    sourceLanguage: string;
} | null;

function StoryHistory({ onSelectStory }: { onSelectStory: (story: Story) => void; }) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const storiesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        const storiesCollectionRef = collection(firestore, 'users', user.uid, 'stories');
        return query(storiesCollectionRef, orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const { data: stories, isLoading, error } = useCollection<Story>(storiesQuery);

    if (isUserLoading) {
      return (
          <div className="flex justify-center p-4">
              <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
          </div>
      );
    }
    
    if (!user) return null;

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History /> Your Story History</CardTitle>
                <CardDescription>Revisit stories you've generated in the past.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <LoaderCircle className="animate-spin mx-auto" />}
                {error && <p className="text-destructive">Error loading history: {error.message}</p>}
                {stories && stories.length === 0 && <p className="text-muted-foreground text-center">You haven't generated any stories yet.</p>}
                {stories && stories.length > 0 && (
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {stories.map(story => (
                            <li key={story.id}>
                                <button 
                                    onClick={() => onSelectStory(story)}
                                    className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors"
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

export default function StoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyResult, setStoryResult] = useState<StoryResult>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof StoryFormSchema>>({
    resolver: zodResolver(StoryFormSchema),
    defaultValues: {
      difficulty: 'beginner',
    },
  });

  async function onSubmit(data: z.infer<typeof StoryFormSchema>) {
    if (!user || !firestore) {
        setError("You must be logged in to generate a story.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setStoryResult(null);
    setSelectedStory(null);

    const result = await generateAndTranslateStory(data);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    } 
    
    if (result.originalStory && result.translatedText) {
        const newStoryData: Omit<Story, 'id' | 'audioUrl' | 'createdAt'> & { createdAt: any } = {
            userId: user.uid,
            level: data.difficulty,
            sourceLanguage: data.sourceLanguage,
            targetLanguage: data.targetLanguage,
            nativeText: result.originalStory,
            translatedText: result.translatedText,
            createdAt: serverTimestamp() 
        };

        setStoryResult({
            originalStory: result.originalStory,
            translatedText: result.translatedText,
            sourceLanguage: data.sourceLanguage,
        });
      
        try {
            const storyCollectionRef = collection(firestore, 'users', user.uid, 'stories');
            await addDoc(storyCollectionRef, newStoryData);
        } catch (firestoreError) {
            const message = firestoreError instanceof Error ? firestoreError.message : 'An unknown error occurred';
            setError("Story generated, but failed to save to your history. " + message);
        }
    } else {
        setError('An unknown error occurred while generating the story.');
    }

    setIsLoading(false);
  }

  const handleSelectStoryFromHistory = (story: Story) => {
    setSelectedStory(story);
    setStoryResult({
        originalStory: story.nativeText,
        translatedText: story.translatedText,
        sourceLanguage: story.sourceLanguage,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (isUserLoading) {
    return (
        <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
            <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
        </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">Nuncy Pronunciation AI Detective</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Generate a short story at your difficulty level, then practice your reading with our karaoke-style player.
        </p>
      </div>
      
      {storyResult && (
        <div className="mb-8">
            <StoryViewer 
                key={selectedStory?.id || 'new-story'}
                originalStory={storyResult.originalStory}
                translatedText={storyResult.translatedText}
                sourceLanguage={storyResult.sourceLanguage}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setError={setError}
            />
        </div>
      )}

      {error && (
         <Alert variant="destructive" className="my-8">
            <AlertTitle>Action Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {!user ? (
         <Card className="w-full max-w-md mx-auto text-center shadow-lg">
          <CardHeader>
            <CardTitle>Welcome to Nuncy Pronunciation AI Detective</CardTitle>
            <CardDescription>Log in to generate stories and save your history.</CardDescription>
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
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>Create a New Story</CardTitle>
                <CardDescription>Select your languages and difficulty level.</CardDescription>
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
                            <FormLabel>Your Language</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your native language" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="targetLanguage"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Language to Learn</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a language to learn" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && !storyResult ? (
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
        </div>
      )}
    </main>
  );
}
