"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  BookOpenCheck,
  Languages,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { generateAndTranslateStory } from "./actions";
import { LANGUAGES } from "@/config/languages";
import StoryViewer from "@/components/story-viewer";
import { Logo } from "@/components/icons";

const FormSchema = z.object({
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  targetLanguage: z.string({
    required_error: "Please select a language.",
  }),
});

type StoryResult = {
  originalStory: string;
  translatedText: string;
  audioDataUri: string;
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyResult, setStoryResult] = useState<StoryResult | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      difficulty: "beginner",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setError(null);
    setStoryResult(null);

    const result = await generateAndTranslateStory(data);

    if (result.error) {
      setError(result.error);
    } else {
      setStoryResult(result as StoryResult);
    }

    setIsLoading(false);
  }

  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <header className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Logo className="h-12 w-12 text-primary" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
            LinguaTune
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Learn languages with AI-powered stories and karaoke-style reading.
        </p>
      </header>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create Your Story</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <BookOpenCheck className="h-5 w-5" />
                        Select Difficulty
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
              </div>

              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isLoading}
              >
                {isLoading && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLoading ? "Generating..." : "Generate Story"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator className="my-8" />
      
      {isLoading && (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
          <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold">
            Your story is being crafted...
          </p>
          <p className="text-muted-foreground">
            This may take a moment. The AI is writing, translating, and
            recording.
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {storyResult && (
        <StoryViewer
          originalStory={storyResult.originalStory}
          translatedText={storyResult.translatedText}
          audioDataUri={storyResult.audioDataUri}
        />
      )}
    </main>
  );
}
