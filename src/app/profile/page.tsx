
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
import { LoaderCircle, LogIn, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { generateProfileAvatars } from '../actions';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const ProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  bio: z.string().min(10, 'Bio must be at least 10 characters.').max(200, 'Bio cannot exceed 200 characters.'),
  nativeLanguage: z.string({ required_error: 'Please select your native language.' }),
  learningLanguage: z.string({ required_error: 'Please select a language to learn.' }),
  avatarUrl: z.string().url().optional(),
});

type CommunityProfile = z.infer<typeof ProfileSchema> & {
  id: string;
  userId: string;
};

function AvatarSelectionDialog({ name, onSelectAvatar }: { name: string; onSelectAvatar: (url: string) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [avatars, setAvatars] = useState<string[]>([]);
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!name) {
            setError("Please enter your name first to generate avatars.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAvatars([]);

        const result = await generateProfileAvatars({ name });

        if (result.error) {
            setError(result.error);
        } else if (result.avatars) {
            setAvatars(result.avatars);
        }
        setIsLoading(false);
    };

    const handleSelect = (avatarUrl: string) => {
        setSelectedAvatar(avatarUrl);
        onSelectAvatar(avatarUrl);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Avatars
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Generate Your Avatar</DialogTitle>
                    <DialogDescription>
                        Click the button to generate unique, abstract avatars based on your name. Click on an image to select it.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center my-4">
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? <LoaderCircle className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                        Generate New Avatars
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Generation Failed</AlertTitle>
                        <p>{error}</p>
                    </Alert>
                )}

                {avatars.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                        {avatars.map((avatar, index) => (
                            <div key={index} className="relative cursor-pointer" onClick={() => handleSelect(avatar)}>
                                <Image
                                    src={avatar}
                                    alt={`Generated Avatar ${index + 1}`}
                                    width={250}
                                    height={250}
                                    className={cn("rounded-lg border-4 transition-all", selectedAvatar === avatar ? "border-primary" : "border-transparent")}
                                />
                                {selectedAvatar === avatar && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                        <CheckCircle className="h-12 w-12 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button">Done</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);


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
      avatarUrl: '',
    },
  });
  
  useEffect(() => {
    if (existingProfile) {
      form.reset(existingProfile);
      setSelectedAvatarUrl(existingProfile.avatarUrl || user?.photoURL || null);
    } else if (user) {
        form.reset({
            name: user.displayName || '',
            bio: '',
            avatarUrl: user.photoURL || '',
        });
        setSelectedAvatarUrl(user.photoURL || null);
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
      avatarUrl: selectedAvatarUrl || user.photoURL || undefined, // Use selected avatar or fallback
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

  const nameValue = form.watch('name');
  const currentAvatarUrl = selectedAvatarUrl || form.watch('avatarUrl') || user?.photoURL;


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
                <div className="flex flex-col items-center space-y-4">
                    <Avatar className="w-32 h-32 border-4 border-primary">
                        <AvatarImage src={currentAvatarUrl || undefined} alt={nameValue} />
                        <AvatarFallback>{nameValue?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <AvatarSelectionDialog name={nameValue} onSelectAvatar={setSelectedAvatarUrl} />
                </div>
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
