// src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, getFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LANGUAGES } from '@/config/languages';
import { LoaderCircle, LogIn, AlertCircle, Sparkles, CheckCircle, Warehouse, GraduationCap, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { generateProfileAvatarsAction, analyzeAcademicLevelAction } from '../actions';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useTranslation } from '@/hooks/use-translation';
import { analyzeStudiesAndBoostCommunityAction } from '../actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  bio: z.string().min(10, 'Bio must be at least 10 characters.').max(200, 'Bio cannot exceed 200 characters.'),
  nativeLanguage: z.string({ required_error: 'Please select your native language.' }),
  learningLanguage: z.string({ required_error: 'Please select a language to learn.' }),
  avatarUrl: z.string().url().optional(),
  academicLevel: z.string().optional(),
});

type CommunityProfile = z.infer<typeof ProfileSchema> & {
  id: string;
  userId: string;
};

const AcademicAnalysisSchema = z.object({
    studies: z.string().min(20, 'Please provide a more detailed description of your studies (at least 20 characters).')
});


function AcademicAnalyzer({ onLevelAnalyzed }: { onLevelAnalyzed: (level: string) => void }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { user } = useUser();
    
    const form = useForm<z.infer<typeof AcademicAnalysisSchema>>({
        resolver: zodResolver(AcademicAnalysisSchema),
        defaultValues: { studies: '' },
    });

    async function onSubmit(data: z.infer<typeof AcademicAnalysisSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: "Authentication Error", description: "You must be logged in to use this feature." });
            return;
        }
        setIsAnalyzing(true);
        try {
            // This now calls the tool via the Ambassador
            const result = await analyzeStudiesAndBoostCommunityAction({ 
                userId: user.uid,
                communityId: 'pleasance-founding-community', // Example community ID
                studies: data.studies 
            });

            if (result.error) {
                throw new Error(result.error);
            }
            onLevelAnalyzed(result.academicLevel);
            toast({ title: "Analysis Complete", description: result.message });
        } catch(e) {
            const message = e instanceof Error ? e.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: "Analysis Failed", description: message });
        } finally {
            setIsAnalyzing(false);
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Academic Level
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Academic Level AI Analyzer</DialogTitle>
                    <DialogDescription>
                        Describe your academic background, formal or self-taught. The AI will analyze it to determine an equivalent academic standing and contribute value to the community.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="studies"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Describe Your Studies</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g., 'I have a Bachelor's in Philosophy but have spent the last 5 years as an autodidact studying..." {...field} rows={6}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isAnalyzing}>
                                {isAnalyzing ? <LoaderCircle className="mr-2 animate-spin" /> : <GraduationCap className="mr-2" />}
                                Analyze & Contribute
                            </Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    );
}


function AvatarSelectionDialog({ name, onSelectAvatar }: { name: string; onSelectAvatar: (url: string) => void }) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [avatars, setAvatars] = useState<string[]>([]);
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!name) {
            setError(t('profile_avatar_name_required'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setAvatars([]);

        const result = await generateProfileAvatarsAction({ name });

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
                    {t('profile_edit_avatar_button')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{t('profile_avatar_dialog_title')}</DialogTitle>
                    <DialogDescription>
                        {t('profile_avatar_dialog_desc')}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center my-4">
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? <LoaderCircle className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                        {t('profile_avatar_generate_button')}
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('profile_avatar_fail_title')}</AlertTitle>
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
                        <Button type="button">{t('profile_avatar_done_button')}</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast()
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const form = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: '',
      bio: '',
      avatarUrl: '',
      academicLevel: '',
    },
  });

  useEffect(() => {
      const fetchProfile = async () => {
        if (!user) {
            setIsProfileLoading(false);
            return;
        }
        setIsProfileLoading(true);
        const { firestore } = getFirebase();
        if (!firestore) {
            setIsProfileLoading(false);
            return;
        }
        const profileDocRef = doc(firestore, 'community-profiles', user.uid);
        const docSnap = await getDoc(profileDocRef);
        
        if (docSnap.exists()) {
            const existingProfile = docSnap.data();
            form.reset(existingProfile);
            setSelectedAvatarUrl(existingProfile.avatarUrl || user?.photoURL || null);
        } else if (user) {
            form.reset({
                name: user.displayName || '',
                bio: '',
                avatarUrl: user.photoURL || '',
                academicLevel: '',
            });
            setSelectedAvatarUrl(user.photoURL || null);
        }
        setIsProfileLoading(false);
      }
      if (!isUserLoading) {
        fetchProfile();
      }
  }, [user, form, isUserLoading]);


  async function onSubmit(data: z.infer<typeof ProfileSchema>) {
    if (!user) {
      setError(t('profile_edit_toast_login_error'));
      return;
    }
    setIsLoading(true);
    setError(null);
    const { firestore } = getFirebase();
    const profileDocRef = doc(firestore, 'community-profiles', user.uid);

    const profileData: CommunityProfile = {
      ...data,
      id: user.uid,
      userId: user.uid,
      avatarUrl: selectedAvatarUrl || user.photoURL || undefined,
    };

    try {
      setDocumentNonBlocking(profileDocRef, profileData, { merge: true });
      toast({
        title: t('profile_edit_toast_save_success_title'),
        description: t('profile_edit_toast_save_success_desc'),
      })
      router.push('/community');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`${t('profile_edit_toast_save_fail')} ${message}`);
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
            <CardTitle>{t('profile_edit_login_required_title')}</CardTitle>
            <CardDescription>{t('profile_edit_login_required_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> {t('profile_edit_login_button')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl py-8">
        <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="text-3xl">{t('profile_edit_title')}</CardTitle>
                <CardDescription>{t('profile_edit_desc')}</CardDescription>
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
                            <FormLabel>{t('profile_edit_name_label')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('profile_edit_name_placeholder')} {...field} />
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
                            <FormLabel>{t('profile_edit_bio_label')}</FormLabel>
                            <FormControl>
                            <Textarea placeholder={t('profile_edit_bio_placeholder')} {...field} />
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
                            <FormLabel>{t('profile_edit_native_lang_label')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('profile_edit_native_lang_placeholder')} />
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
                            <FormLabel>{t('profile_edit_learning_lang_label')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('profile_edit_learning_lang_placeholder')} />
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
                     <FormField
                        control={form.control}
                        name="academicLevel"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Academic Level</FormLabel>
                            <FormControl>
                            <Input placeholder="Not yet analyzed" {...field} readOnly className="bg-muted"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="flex flex-wrap gap-4 items-center">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                            <>
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> {t('profile_edit_saving_button')}
                            </>
                            ) : t('profile_edit_save_button')}
                        </Button>
                        <AcademicAnalyzer onLevelAnalyzed={(level) => form.setValue('academicLevel', level)} />
                         <Button asChild variant="link">
                            <Link href={`/profile/${user.uid}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Public Profile
                            </Link>
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    </form>
                </Form>
                </CardContent>
            </Card>

            <Card className="mt-8 bg-muted/50">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Warehouse className="text-primary"/>
                        {t('profile_artisan_title')}
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{t('profile_artisan_desc')}</p>
                    <Button asChild variant="secondary">
                        <Link href="/fabrication">{t('profile_artisan_cta')}</Link>
                    </Button>
                 </CardContent>
            </Card>
        </div>
    </main>
  );
}
