'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  BookOpenCheck,
  Languages,
  LoaderCircle,
  AlertCircle,
  Book,
  Palette,
} from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { generateAndTranslateStory } from '../actions';
import { LANGUAGES } from '@/config/languages';
import StoryViewer from '@/components/story-viewer';

const FormSchema = z.object({
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceLanguage: z.string({
    required_error: 'Please select a source language.',
  }),
  targetLanguage: z.string({
    required_error: 'Please select a language.',
  }),
  stylePrompt: z.string().optional(),
});

type StoryResult = {
  originalStory: string;
  translatedText: string;
  audioDataUri: string;
  imageUrl: string;
  sourceLanguage: string;
};

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold">
                Your story is being crafted...
            </p>
            <p className="text-muted-foreground max-w-md">
                This may take a minute. The AI is writing, illustrating, translating, and
                recording the audio. Please wait.
            </p>
        </div>
    )
}

export default function StoryCreatorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyResult, setStoryResult] = useState<StoryResult | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      difficulty: 'beginner',
      sourceLanguage: 'English',
      targetLanguage: 'Spanish',
      stylePrompt: 'A vibrant, colorful digital painting.',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setError(null);
    setStoryResult(null);

    try {
      const result = await generateAndTranslateStory(data);

      if (result.error) {
        setError(result.error);
      } else {
        setStoryResult(result as StoryResult);
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`An unexpected error occurred. ${message}`);
    }

    setIsLoading(false);
  }

  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <header className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpenCheck className="h-12 w-12 text-primary" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
            Story Creator
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Create illustrated, audible stories for language learning.
        </p>
      </header>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create Your Story</CardTitle>
          <CardDescription>
            Select your preferences and let the AI generate a unique story for
            you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <BookOpenCheck className="h-5 w-5" />
                        Difficulty
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a difficulty level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Book className="h-5 w-5" />
                        Story Language
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select story language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
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
                      <FormLabel className="flex items-center gap-2">
                        <Languages className="h-5 w-5" />
                        Target Language
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language to learn" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
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
              </div>

              <FormField
                control={form.control}
                name="stylePrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Cover Art Style
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 'A children's book illustration'"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isLoading}
              >
                {isLoading && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLoading ? 'Generating...' : 'Generate Story'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {isLoading && <LoadingState />}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {storyResult && (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <Card className="shadow-lg overflow-hidden">
                <CardHeader>
                    <CardTitle>Your Digital Book</CardTitle>
                    <CardDescription>Here is your generated story with its unique cover.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <Image
                                src={storyResult.imageUrl}
                                alt="Generated story cover"
                                width={400}
                                height={600}
                                className="rounded-lg shadow-md object-cover w-full h-auto"
                                priority
                            />
                        </div>
                        <div className="md:col-span-2">
                           <StoryViewer
                             originalStory={storyResult.originalStory}
                             translatedText={storyResult.translatedText}
                             audioDataUri={storyResult.audioDataUri}
                             sourceLanguage={storyResult.sourceLanguage}
                           />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </main>
  );
}
