// src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LANGUAGES } from '@/config/languages';
import { LoaderCircle, LogIn, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast"

const ProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  bio: z.string().min(10, 'Bio must be at least 10 characters.').max(200, 'Bio cannot exceed 200 characters.'),
  nativeLanguage: z.string({ required_error: 'Please select your native language.' }),
  learningLanguage: z.string({ required_error: 'Please select a language to learn.' }),
});

type CommunityProfile = z.infer<typeof ProfileSchema> & { id: string; userId: string };

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'community-profiles', user.uid);
  }, [user, firestore]);

  const { data: existingProfile, isLoading: isProfileLoading } = useDoc<CommunityProfile>(profileDocRef);

  const form = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: '',
      bio: '',
    },
  });
  
  useEffect(() => {
    if (existingProfile) {
      form.reset({
        name: existingProfile.name,
        bio: existingProfile.bio,
        nativeLanguage: existingProfile.nativeLanguage,
        learningLanguage: existingProfile.learningLanguage,
      });
    } else if (user) {
        form.reset({
            name: user.displayName || '',
            bio: '',
        })
    }
  }, [existingProfile, form, user]);

  async function onSubmit(data: z.infer<typeof ProfileSchema>) {
    if (!user || !firestore) {
      setError('You must be logged in to update your profile.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const profileData: CommunityProfile = {
      ...data,
      id: user.uid,
      userId: user.uid,
    };

    try {
      setDocumentNonBlocking(profileDocRef!, profileData, { merge: true });
      toast({
        title: "Profile Saved!",
        description: "Your community profile has been updated.",
      })
      // Redirect to community page after profile is created/updated
      router.push('/community');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`Failed to save profile. ${message}`);
    }
    setIsLoading(false);
  }

  if (isUserLoading || isProfileLoading) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to be logged in to view or edit your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">{existingProfile ? 'Edit Your' : 'Create Your'} Community Profile</CardTitle>
          <CardDescription>This information will be visible to other members in the communities you join.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your display name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell everyone a little about yourself..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nativeLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Native Language</FormLabel>
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
                  name="learningLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Language</FormLabel>
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
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : 'Save Profile'}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <p>{error}</p>
                </Alert>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
