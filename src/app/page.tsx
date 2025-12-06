
// src/app/page.tsx (formerly community/page.tsx)
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, where, orderBy, getDocs, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { LoaderCircle, User, Users, PlusCircle, LogIn, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createCommunityDetails } from '@/app/actions';
import { addDocument } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { refineCommunityPromptAction } from './actions';
import { useTranslation } from '@/hooks/use-translation';
import { Textarea } from '@/components/ui/textarea';

type Member = {
  name: string;
  role: string;
  bio: string;
  type: 'AI' | 'human';
};

type Community = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: Member[];
  flagUrl?: string;
};

const CreateCommunitySchema = z.object({
  prompt: z.string().min(10, {
    message: "Your community vision must be at least 10 characters long.",
  }),
  includeAiAgents: z.boolean().default(false),
});

function CommunityCard({ community }: { community: Community }) {
  const router = useRouter();

  return (
    <Card 
      className="overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer"
      onClick={() => router.push(`/community/${community.id}`)}
    >
      <div className="relative h-48 w-full bg-muted">
        {community.flagUrl ? (
            <Image src={community.flagUrl} alt={`${community.name} Flag`} fill style={{ objectFit: 'cover' }} />
        ) : (
             <div className="flex h-full w-full items-center justify-center">
                <Users className="h-16 w-16 text-muted-foreground" />
            </div>
        )}
      </div>
      <CardHeader>
        <CardTitle>{community.name}</CardTitle>
        <CardDescription className="line-clamp-2">{community.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <div className="flex -space-x-2 overflow-hidden">
          {community.members.slice(0, 5).map((member, index) => (
            <Avatar key={index} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${member.name}`} />
              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        {community.members.length > 5 && (
          <span className="pl-4 text-sm text-muted-foreground">
            + {community.members.length - 5} more
          </span>
        )}
      </CardFooter>
    </Card>
  );
}


function CreateCommunityForm() {
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefining, setIsRefining] = useState(false);

    const form = useForm<z.infer<typeof CreateCommunitySchema>>({
        resolver: zodResolver(CreateCommunitySchema),
        defaultValues: {
            prompt: '',
            includeAiAgents: true,
        }
    });

    const handleRefine = async () => {
        const prompt = form.getValues('prompt');
        if (!prompt) {
            toast({
                variant: 'destructive',
                title: t('community_prompt_required_title'),
                description: t('community_prompt_required_desc'),
            });
            return;
        }
        setIsRefining(true);
        try {
            const result = await refineCommunityPromptAction({ prompt });
            if (result.error) throw new Error(result.error);
            form.setValue('prompt', result.refinedPrompt, { shouldValidate: true });
            toast({
                title: t('community_idea_refined_title'),
                description: t('community_idea_refined_desc'),
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: t('community_refinement_failed_title'), description: message });
        }
        setIsRefining(false);
    }

    async function onSubmit(values: z.infer<typeof CreateCommunitySchema>) {
        if (!user || !firestore) {
            toast({
                variant: 'destructive',
                title: t('community_must_be_logged_in'),
            });
            return;
        }
        setIsSubmitting(true);
        try {
            const communityDetails = await createCommunityDetails(values);
            if (communityDetails.error) throw new Error(communityDetails.error);
            
            const communityColRef = collection(firestore, 'communities');
            const docRef = await addDocument(communityColRef, {
                name: communityDetails.name,
                description: communityDetails.description,
                welcomeMessage: communityDetails.welcomeMessage,
                ownerId: user.uid,
                members: communityDetails.members,
            });
            
            // Add owner as a member
            const ownerProfileDoc = await getDoc(doc(firestore, 'community-profiles', user.uid));
            if (ownerProfileDoc.exists()) {
                const ownerProfile = ownerProfileDoc.data();
                const ownerMember = {
                    userId: user.uid,
                    name: ownerProfile.name,
                    bio: ownerProfile.bio,
                    role: 'Founder',
                    type: 'human',
                    avatarUrl: ownerProfile.avatarUrl || user.photoURL || '',
                };
                 await addDocument(collection(firestore, `communities/${docRef.id}/members`), ownerMember);
            }

            toast({ title: "Community Created!", description: `Your community "${communityDetails.name}" is now live.` });
            router.push(`/community/${docRef.id}`);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({
                variant: 'destructive',
                title: 'Community Creation Failed',
                description: message,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!user) {
        return (
             <Card className="shadow-lg mb-8">
                <CardHeader>
                    <CardTitle>{t('community_join_federation_title')}</CardTitle>
                    <CardDescription>{t('community_join_federation_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" /> {t('community_login_to_manage')}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
         <Card className="shadow-lg mb-8">
            <CardHeader>
                <CardTitle>{t('community_create_title')}</CardTitle>
                <CardDescription>{t('community_create_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="prompt"
                            render={({ field }) => (
                                <FormItem>
                                    <Label htmlFor="prompt">{t('community_vision_label')}</Label>
                                    <div className="relative">
                                    <Textarea id="prompt" placeholder={t('community_vision_placeholder')} {...field} />
                                    <Button type="button" size="icon" variant="ghost" onClick={handleRefine} disabled={isRefining} className="absolute bottom-2 right-2">
                                       {isRefining ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4 text-primary" />}
                                    </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="includeAiAgents"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <Label htmlFor="includeAiAgents" className="cursor-pointer">{t('community_create_with_ai')}</Label>
                                        <p className="text-xs text-muted-foreground">{t('community_create_with_ai_desc')}</p>
                                    </div>
                                </FormItem>
                            )}
                        />
                         <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    {t('community_creating_button')}
                                </>
                            ) : (
                                <>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {t('community_create_button')}
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default function CommunityPage() {
    const { user } = useUser();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useTranslation();

    useEffect(() => {
        if (!firestore) return;
        const fetchCommunities = async () => {
            const communitiesQuery = query(collection(firestore, 'communities'), orderBy('name'));
            const snapshot = await getDocs(communitiesQuery);
            setCommunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community)));
            setIsLoading(false);
        };
        fetchCommunities();
    }, []);

    const filteredCommunities = useMemo(() => {
        return communities.filter(community => 
            community.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [communities, searchQuery]);
    
    const yourCommunities = useMemo(() => {
        if (!user) return [];
        return communities.filter(c => c.ownerId === user.uid);
    }, [communities, user]);
    
    const otherCommunities = useMemo(() => {
        if (!user) return filteredCommunities;
        return filteredCommunities.filter(c => c.ownerId !== user.uid);
    }, [filteredCommunities, user]);


    if (isLoading) {
        return (
            <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
                <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
            </main>
        );
    }

    return (
        <main className="container mx-auto min-h-screen max-w-6xl py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
                    <Users /> {t('community_page_title')}
                </h1>
                <p className="text-lg text-muted-foreground mt-2">{t('community_page_subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                    <CreateCommunityForm />
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>{t('federation_what_is_title')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{t('federation_documentation')}</p>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>{t('community_find_title')}</CardTitle>
                            <CardDescription>{t('community_find_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder={t('community_search_placeholder')}
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {yourCommunities.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-4">{t('community_your_communities')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {yourCommunities.map(community => <CommunityCard key={community.id} community={community} />)}
                            </div>
                            <hr className="my-8" />
                        </div>
                    )}

                    <h3 className="text-xl font-semibold mb-4">{t('community_all_communities')}</h3>
                    {otherCommunities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {otherCommunities.map(community => <CommunityCard key={community.id} community={community} />)}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">{t('community_none_found')}</p>
                    )}
                </div>
            </div>
        </main>
    );
}
