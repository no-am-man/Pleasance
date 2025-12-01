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
import { LoaderCircle, Sparkles } from 'lucide-react';
import { LANGUAGES } from '@/config/languages';
import { generateAndTranslateStory } from '@/app/actions';
import StoryViewer from '@/components/story-viewer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const StoryFormSchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceLanguage: z.string({ required_error: 'Please select a source language.' }),
  targetLanguage: z.string({ required_error: 'Please select a target language.' }),
});

type StoryResult = {
    originalStory: string;
    translatedText: string;
    audioDataUri: string;
    sourceLanguage: string;
} | null;

export default function StoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyResult, setStoryResult] = useState<StoryResult>(null);

  const form = useForm<z.infer<typeof StoryFormSchema>>({
    resolver: zodResolver(StoryFormSchema),
    defaultValues: {
      difficulty: 'beginner',
    },
  });

  async function onSubmit(data: z.infer<typeof StoryFormSchema>) {
    setIsLoading(true);
    setError(null);
    setStoryResult(null);

    const result = await generateAndTranslateStory(data);

    if (result.error) {
      setError(result.error);
    } else if (result.originalStory && result.translatedText) {
      setStoryResult({
        originalStory: result.originalStory,
        translatedText: result.translatedText,
        audioDataUri: result.audioDataUri || '',
        sourceLanguage: result.sourceLanguage || 'English',
      });
    } else {
        setError('An unknown error occurred while generating the story.');
    }

    setIsLoading(false);
  }

  return (
    <main className="container mx-auto max-w-4xl py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">Nuncy</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Generate a short story at your difficulty level, then practice your reading with our karaoke-style player.
        </p>
      </div>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>Create Your Story</CardTitle>
          <CardDescription>Select your languages and difficulty level.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      
      {isLoading && (
        <div className="flex items-center justify-center py-12">
            <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
        </div>
      )}

      {error && (
         <Alert variant="destructive" className="my-8">
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}
      
      {storyResult && (
        <StoryViewer 
            originalStory={storyResult.originalStory}
            translatedText={storyResult.translatedText}
            audioDataUri={storyResult.audioDataUri}
            sourceLanguage={storyResult.sourceLanguage}
        />
      )}

    </main>
  );
}
