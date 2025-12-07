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
import { LoaderCircle, User, Users, PlusCircle, LogIn, Search, Sparkles, Shield, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createCommunityDetailsAction } from '@/app/actions';
import { addDocument } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { refineCommunityPromptAction } from './actions';
import { useTranslation } from '@/hooks/use-translation';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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

function CommunityCard({ community, isOwner }: { community: Community, isOwner: boolean }) {
  const router = useRouter();

  return (
    <Card 
      className="overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer flex flex-col h-full"
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
         {isOwner && (
            <Badge variant="secondary" className="absolute top-2 right-2 flex items-center gap-1 border-primary/50">
                <Shield className="h-3 w-3" />
                Owner
            </Badge>
        )}
      </div>
      <div className="flex flex-col flex-grow">
        <CardHeader>
            <CardTitle>{community.name}</CardTitle>
            <CardDescription className="line-clamp-2">{community.description}</CardDescription>
        </CardHeader>
        <CardFooter className="mt-auto">
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
      </div>
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
            const communityDetails = await createCommunityDetailsAction(values);
            
            const communityColRef = collection(firestore, 'communities');
            const newCommunityRef = doc(communityColRef); // Create a new doc ref to get an ID

            const newCommunityData = {
                id: newCommunityRef.id,
                name: communityDetails.name,
                description: communityDetails.description,
                welcomeMessage: communityDetails.welcomeMessage,
                ownerId: user.uid,
                members: [], // Start with no members
            };
            
            // Add owner as a member
            const ownerProfileDoc = await getDoc(doc(firestore, 'community-profiles', user.uid));
            let ownerMember;
            if (ownerProfileDoc.exists()) {
                const ownerProfile = ownerProfileDoc.data();
                ownerMember = {
                    userId: user.uid,
                    name: ownerProfile.name,
                    bio: ownerProfile.bio,
                    role: 'Founder',
                    type: 'human',
                    avatarUrl: ownerProfile.avatarUrl || user.photoURL || '',
                };
            }
            
            const finalMembers = [
                ...(ownerMember ? [ownerMember] : []),
                ...(communityDetails.members || [])
            ];

            await addDocument(communityColRef, { ...newCommunityData, members: finalMembers });
            

            toast({ title: "Community Created!", description: `Your community "${communityDetails.name}" is now live.` });
            router.push(`/community/${newCommunityData.id}`);

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
    const { user, isUserLoading } = useUser();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useTranslation();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        if (isUserLoading || !firestore) {
            // Wait for authentication to be resolved
            return;
        }

        const fetchCommunities = async () => {
            setIsLoading(true);
            const communitiesQuery = query(collection(firestore, 'communities'), orderBy('name'));
            const snapshot = await getDocs(communitiesQuery);
            setCommunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community)));
            setIsLoading(false);
        };

        fetchCommunities();
    }, [isUserLoading]);

    const filteredCommunities = useMemo(() => {
        return communities.filter(community => 
            community.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [communities, searchQuery]);
    
    if (isLoading || isUserLoading) {
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
            
            <div className="space-y-8">
                <Card className="shadow-lg bg-background/80 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-headline"><Info className="text-primary"/> {t('federation_what_is_title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{t('federation_documentation')}</p>
                    </CardContent>
                </Card>

                <Collapsible open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <CollapsibleTrigger asChild>
                        <div className="flex justify-center">
                            <Button variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {isCreateOpen ? "Hide Creation Form" : "Create a New Community"}
                            </Button>
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-6">
                        <div className="max-w-2xl mx-auto">
                            <CreateCommunityForm />
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                
                <Separator />

                <div className="max-w-2xl mx-auto">
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
                </div>
                
                {filteredCommunities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCommunities.map(community => (
                            <CommunityCard 
                                key={community.id} 
                                community={community}
                                isOwner={user?.uid === community.ownerId}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-12">{t('community_none_found')}</p>
                )}
            </div>
        </main>
    );
}
