
// src/app/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useMemoFirebase, getFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, getDocs, serverTimestamp, writeBatch, doc, getDoc } from 'firebase/firestore';
import { refineCommunityPromptAction, createCommunityDetailsAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { LoaderCircle, User as UserIcon, Users, LogIn, Sparkles, PlusCircle, Link as LinkIcon, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FederationDiagram } from '@/components/federation-diagram';
import { useTranslation } from '@/hooks/use-translation';
import type { Community, Member } from '@/lib/types';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';


const PromptSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters long.'),
  includeAiAgents: z.boolean().default(true),
});


function CreateCommunityCard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof PromptSchema>>({
    resolver: zodResolver(PromptSchema),
    defaultValues: { prompt: '', includeAiAgents: true },
  });

  async function handleRefine() {
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
      form.setValue('prompt', result.refinedPrompt);
      toast({
        title: t('community_idea_refined_title'),
        description: t('community_idea_refined_desc'),
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('community_refinement_failed_title'),
        description: e instanceof Error ? e.message : 'An unknown error occurred.',
      });
    } finally {
      setIsRefining(false);
    }
  }

  async function onSubmit(data: z.infer<typeof PromptSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: t('community_must_be_logged_in'),
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const { firestore } = getFirebase();
      if (!firestore) {
          throw new Error("Firestore not initialized.");
      }
      const newCommunityData = await createCommunityDetailsAction(data);
      const batch = writeBatch(firestore);

      const communityRef = doc(collection(firestore, 'communities'));
      
      const profileRef = doc(firestore, 'community-profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      const ownerMember: Member = {
          userId: user.uid,
          name: user.displayName || 'Founder',
          bio: 'Community Founder',
          role: 'Founder',
          type: 'human',
          avatarUrl: user.photoURL || '',
      };

      if (profileSnap.exists()) {
        const profile = profileSnap.data();
        ownerMember.name = profile.name;
        ownerMember.bio = profile.bio;
        ownerMember.avatarUrl = profile.avatarUrl || user.photoURL || '';
      }
      
      batch.set(communityRef, {
        ...newCommunityData,
        id: communityRef.id,
        ownerId: user.uid,
        members: [ownerMember, ...newCommunityData.members],
        createdAt: serverTimestamp(),
      });
      
      await batch.commit();

      toast({
        title: 'Community Created!',
        description: `"${newCommunityData.name}" has been founded.`,
      });
      form.reset();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Community Creation Failed',
        description: message,
      });
    }
    setIsSubmitting(false);
  }

  if (!user) {
    return (
        <Card className="w-full text-center shadow-lg">
            <CardHeader>
                <CardTitle>{t('community_join_federation_title')}</CardTitle>
                <CardDescription>{t('community_join_federation_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                       {t('community_login_to_manage')}
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-lg">
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
                  <FormLabel>{t('community_vision_label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('community_vision_placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="includeAiAgents"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                        <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>{t('community_create_with_ai')}</FormLabel>
                        <FormDescription>
                        {t('community_create_with_ai_desc')}
                        </FormDescription>
                    </div>
                    </FormItem>
                )}
            />
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleRefine} disabled={isRefining || isSubmitting}>
                    {isRefining ? <LoaderCircle className="animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {t('community_refine_with_ai')}
                </Button>
                <Button type="submit" disabled={isSubmitting || isRefining}>
                    {isSubmitting ? (
                        <LoaderCircle className="animate-spin" />
                    ) : (
                        <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    {t('community_create_button')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function CommunityCard({ community }: { community: Community }) {
  const { user } = useUser();
  const { t } = useTranslation();
  if (!community) return null;
  
  const owner = community.members?.find(m => typeof m !== 'string' && m.userId === community.ownerId);
  const isOwner = user?.uid === community.ownerId;

  return (
    <Card className="flex flex-col shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-4">
            {community.flagUrl ? (
                <Image src={community.flagUrl} alt={`${community.name} Flag`} width={64} height={40} className="rounded-sm border" />
            ): (
                <div className="w-16 h-10 bg-muted rounded-sm border" />
            )}
            <div>
                <Link href={`/community/${community.id}`}>
                    <CardTitle className="hover:underline">{community.name}</CardTitle>
                </Link>
                <CardDescription className="line-clamp-2">{community.description}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
         <div className="flex items-center text-sm text-muted-foreground">
            <UserIcon className="h-4 w-4 mr-2" />
            <span>
              {t('community_founded_by')}{' '}
              {owner && owner.userId ? (
                <Link href={`/profile/${owner.userId}`} className="font-semibold underline hover:text-primary">
                  {owner.name || 'Founder'}
                </Link>
              ) : (
                <span>{owner?.name || 'Founder'}</span>
              )}
            </span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-2" />
          <span>{community.members.length} {community.members.length === 1 ? 'member' : 'members'}</span>
        </div>
      </CardContent>
      <CardContent>
         <Button asChild className="w-full">
            <Link href={`/community/${community.id}`}>
                {isOwner ? 'View Your Community' : t('community_request_to_join')}
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function FederationCard({ name, description, url, imageUrl }: { name: string, description: string, url: string, imageUrl?: string }) {
  return (
    <Card className="flex flex-col shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-4">
            {imageUrl ? (
                <Image src={imageUrl} alt={`${name} Flag`} width={64} height={40} className="rounded-sm border" />
            ): (
                <div className="w-16 h-10 bg-muted rounded-sm border flex items-center justify-center">
                    <LinkIcon className="h-6 w-6 text-muted-foreground" />
                </div>
            )}
            <div>
                <a href={url} target="_blank" rel="noopener noreferrer">
                    <CardTitle className="hover:underline">{name}</CardTitle>
                </a>
                <CardDescription className="line-clamp-2">{description}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-xs text-muted-foreground break-all">{url}</p>
      </CardContent>
      <CardContent>
         <Button asChild className="w-full" variant="secondary">
            <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Federation
            </a>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function CommunitiesPage() {
    const { user, isUserLoading } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useTranslation();

    const { firestore } = getFirebase();
    const communitiesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'communities'));
    }, [firestore]);

    const { data: communities, isLoading: isLoadingCommunities } = useCollection<Community>(communitiesQuery);

    const filteredCommunities = useMemo(() => {
        if (!communities) return [];
        return communities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [communities, searchTerm]);
    
    const userCommunities = useMemo(() => {
        if (!user || !communities) return [];
        return communities.filter(c => c.ownerId === user.uid);
    }, [user, communities]);

    const isLoading = isUserLoading || isLoadingCommunities;

  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary font-headline" data-testid="main-heading">
                {t('community_page_title')}
            </h1>
            <p className="text-lg text-muted-foreground mt-2">{t('community_page_subtitle')}</p>
        </div>

        <div className="space-y-12">
            {userCommunities.length > 0 && (
                <div>
                     <h2 className="text-3xl font-bold mb-6 font-headline">{t('community_your_communities')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {userCommunities.map(community => (
                            <CommunityCard key={community.id} community={community} />
                        ))}
                    </div>
                    <Separator className="my-12" />
                </div>
            )}
            
            <CreateCommunityCard />

            <div className="mt-12">
                <h2 className="text-3xl font-bold mb-6 font-headline">{t('community_find_title')}</h2>
                <div className="mb-6">
                    <Input
                        type="search"
                        placeholder={t('community_search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />
                </div>
                {isLoading ? (
                     <div className="flex justify-center p-8"><LoaderCircle className="w-12 h-12 animate-spin text-primary" /></div>
                ) : filteredCommunities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredCommunities.filter(c => !userCommunities.some(uc => uc.id === c.id)).map(community => (
                            <CommunityCard key={community.id} community={community} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">{t('community_none_found')}</p>
                )}
            </div>

            <Separator />

             <div>
                <h2 className="text-3xl font-bold mb-4 font-headline">Allied Federations</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl">
                    An Allied Federation is an independent community running on a forked version of the Pleasance source code from our GitHub repository. They have their own infrastructure and governance but share our core principles of decentralized creation and communion.
                </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FederationCard 
                        name="Lashirilo" 
                        description="A sister project focused on the co-creation of sacred song, poetry, and scripture."
                        url="https://lashirilo.com"
                        imageUrl="https://lashirilo.com/favicon.ico"
                    />
                    <Card className="flex flex-col shadow-lg">
                        <CardHeader>
                            <CardTitle>Link a New Federation</CardTitle>
                            <CardDescription>Enter the URL of another Pleasance instance to add it to the list.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-end">
                            <form className="w-full flex gap-2">
                                <Input placeholder="https://your-federation-url.com" />
                                <Button type="submit">
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <div className="mt-16 text-center">
                <h2 className="text-3xl font-bold font-headline">{t('federation_what_is_title')}</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
                    {t('federation_documentation')}
                </p>
                <div className="my-8 mx-auto max-w-sm">
                    <FederationDiagram t={t} />
                </div>
            </div>

        </div>
    </main>
  );
}
