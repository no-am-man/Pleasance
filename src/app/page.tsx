// src/app/page.tsx (formerly community/page.tsx)
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useUser } from "@/firebase";
import { firestore } from "@/firebase/config";
import { collection, doc, query, where, orderBy, onSnapshot, Unsubscribe, getDocs, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, PlusCircle, LoaderCircle, Search, User, Flag, Sparkles, Users, Bot, Hourglass, Info } from "lucide-react";
import { createCommunityDetails, refineCommunityPromptAction, notifyOwnerOfJoinRequestAction } from "@/app/actions";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import { useDynamicTranslation } from "@/hooks/use-dynamic-translation";

const FormSchema = z.object({
  prompt: z.string().min(10, "Please enter a prompt of at least 10 characters."),
  includeAiAgents: z.boolean().default(true),
});

type Member = {
  name: string;
  role: string;
  bio: string;
  type: 'AI' | 'human';
  userId?: string;
  avatarUrl?: string;
};

type Community = {
  id: string;
  name: string;
  description: string;
  welcomeMessage: string;
  ownerId: string;
  members: Member[];
  flagUrl?: string;
};

type CommunityProfile = {
  id: string;
  userId: string;
  name: string;
  bio: string;
};

function CreateCommunityForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: "",
      includeAiAgents: true,
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!user) {
      setError(t('community_must_be_logged_in'));
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // 1. Call server action to get AI-generated details
      const result = await createCommunityDetails({ prompt: data.prompt, includeAiAgents: data.includeAiAgents });
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      
      const { name, description, welcomeMessage, members } = result;
      
      if (!firestore) {
        throw new Error("Firestore is not initialized");
      }
      // 2. Create the new community object on the client in the top-level 'communities' collection
      const newCommunityRef = doc(collection(firestore, 'communities'));
      const newCommunity: Community = {
        id: newCommunityRef.id,
        ownerId: user.uid,
        name: name!,
        description: description!,
        welcomeMessage: welcomeMessage!,
        members: members!,
      };

      // 3. Save the new community to Firestore from the client
      setDocumentNonBlocking(newCommunityRef, newCommunity, { merge: false });
      
      form.reset();
      // The list will update automatically via the onSnapshot listener
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`Failed to create community. ${message}`);
    }
    setIsLoading(false);
  }
  
  const handleRefinePrompt = async () => {
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
    const result = await refineCommunityPromptAction({ prompt });
    if (result.error) {
      toast({
        variant: 'destructive',
        title: t('community_refinement_failed_title'),
        description: result.error,
      });
    } else if (result.refinedPrompt) {
      form.setValue('prompt', result.refinedPrompt, { shouldValidate: true });
      toast({
        title: t('community_idea_refined_title'),
        description: t('community_idea_refined_desc'),
      });
    }
    setIsRefining(false);
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">{t('community_create_title')}</CardTitle>
        <CardDescription>{t('community_create_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <div className="relative">
                    <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('community_vision_label')}</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder={t('community_vision_placeholder')}
                                        className="w-full p-2 border rounded-md min-h-[100px] bg-background pr-10"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8"
                                    onClick={handleRefinePrompt}
                                    disabled={isRefining}
                                    >
                                    {isRefining ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4 text-primary" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('community_refine_with_ai')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                {form.formState.errors.prompt && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.prompt.message}</p>
                )}
            </div>

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
                    <FormLabel>
                      {t('community_create_with_ai')}
                    </FormLabel>
                    <CardDescription>
                      {t('community_create_with_ai_desc')}
                    </CardDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    {t('community_creating_button')}...
                </>
                ) : (
                <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('community_create_button')}
                </>
                )}
            </Button>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function CommunityCard({ community, profiles }: { community: Community, profiles: CommunityProfile[] | undefined }) {
    const { user } = useUser();
    const [userProfile, setUserProfile] = useState<CommunityProfile | null>(null);
    const { toast } = useToast();
    const [submittingRequests, setSubmittingRequests] = useState<{[key: string]: boolean}>({});
    const { t } = useTranslation();
    
    const { translatedText: translatedName, isLoading: isNameLoading } = useDynamicTranslation(community.name);
    const { translatedText: translatedDescription, isLoading: isDescriptionLoading } = useDynamicTranslation(community.description);

    useEffect(() => {
        if (user && firestore) {
            const fetchUserProfile = async () => {
                const profileDocRef = doc(firestore, 'community-profiles', user.uid);
                const docSnap = await getDoc(profileDocRef);
                setUserProfile(docSnap.exists() ? docSnap.data() as CommunityProfile : null);
            };
            fetchUserProfile();
        }
    }, [user]);

    const handleRequestToJoin = async (community: Community) => {
        if (!user || !userProfile || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and have a profile to join.' });
            return;
        }
        setSubmittingRequests(prev => ({...prev, [community.id]: true}));
        
        const requestRef = doc(firestore, `communities/${community.id}/joinRequests/${user.uid}`);
        
        const newRequest = {
            userId: user.uid,
            userName: userProfile.name,
            userBio: userProfile.bio,
            status: 'pending' as const,
            createdAt: serverTimestamp(),
        };

        try {
            await setDoc(requestRef, newRequest);
            await notifyOwnerOfJoinRequestAction({
                communityId: community.id,
                communityName: community.name,
                requestingUserName: userProfile.name,
            });
            toast({ title: 'Request Sent!', description: 'The community owner has been notified.' });
        } catch(e) {
            const message = e instanceof Error ? e.message : 'An error occurred';
            toast({ variant: 'destructive', title: 'Failed to send request', description: message });
        } finally {
            setSubmittingRequests(prev => ({...prev, [community.id]: false}));
        }
    };
    
    const owner = profiles?.find(p => p.userId === community.ownerId);
    const members = [...(community.members || [])].sort((a, b) => {
        if (a.type === 'human' && b.type !== 'human') return -1;
        if (a.type !== 'human' && b.type === 'human') return 1;
        return 0;
    });
    const isMember = user ? members.some(m => m.userId === user.uid) : false;
    const isSubmitting = submittingRequests[community.id];

    return (
        <li className="rounded-md border transition-colors hover:bg-muted/50 flex flex-col">
            <div className="p-4">
                <div className="flex items-start gap-4">
                    <div className="relative h-20 w-36 flex-shrink-0 rounded-md border bg-muted flex items-center justify-center">
                        <Link href={`/community/${community.id}`} className="block w-full h-full">
                            {community.flagUrl ? (
                                <Image src={community.flagUrl} alt={`${community.name} Flag`} layout="fill" objectFit="cover" className="rounded-md" />
                            ) : (
                                <Flag className="h-8 w-8 text-muted-foreground m-auto" />
                            )}
                        </Link>
                    </div>
                    <div className="flex-1">
                         <h3 className="font-semibold text-lg text-primary hover:underline flex items-center gap-2">
                            <Link href={`/community/${community.id}`}>
                                {isNameLoading ? <LoaderCircle className="w-4 h-4 animate-spin"/> : translatedName}
                            </Link>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex items-center gap-2">
                            {isDescriptionLoading ? <LoaderCircle className="w-4 h-4 animate-spin"/> : translatedDescription}
                        </p>
                        {owner && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold mt-2">
                                <User className="w-4 h-4" />
                                <span>
                                    {t('community_founded_by')}{' '}
                                    <Link href={`/profile/${owner.id}`} className="hover:underline text-primary/80">{owner.name}</Link>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 pt-0 flex-grow">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> {t('community_meet_members')} ({members.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {members.slice(0, 4).map((member, index) => (
                        <div key={member.userId || member.name || index} className="flex items-center gap-3 p-2 rounded-md bg-background/50">
                            <Avatar className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={member.avatarUrl || `https://i.pravatar.cc/150?u=${member.userId || member.name}`} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">{member.name}</p>
                                    {member.type === 'AI' ? (
                                        <Badge variant="outline" className="h-5"><Bot className="w-3 h-3 mr-1" /> AI</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="h-5"><User className="w-3 h-3 mr-1" /> Human</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{member.bio}</p>
                            </div>
                        </div>
                    ))}
                    {members.length > 4 && (
                        <Link href={`/community/${community.id}`} className="flex items-center justify-center p-2 rounded-md bg-background/50 hover:bg-background">
                            <p className="text-xs text-muted-foreground font-semibold">{t('community_and_more', { count: members.length - 4 })}</p>
                        </Link>
                    )}
                </div>
            </div>
            <CardFooter className="p-4 border-t">
                {!isMember && user && (
                <Button onClick={() => handleRequestToJoin(community)} disabled={isSubmitting}>
                    {isSubmitting ? <Hourglass className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {t('community_request_to_join')}
                </Button>
            )}
        </CardFooter>
        </li>
    );
}


function CommunityList({ title, communities, profiles, isLoading, error }: { title: string, communities: Community[] | undefined, profiles: CommunityProfile[] | undefined, isLoading: boolean, error: Error | null }) {
  const { t } = useTranslation();

    if (isLoading) {
      return <div className="flex justify-center"><LoaderCircle className="w-8 h-8 animate-spin text-primary" /></div>;
    }
  
    if (error) {
      return <p className="text-destructive text-center">Error loading communities: {error.message}</p>;
    }
  
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {communities && communities.length > 0 ? (
            <ul className="space-y-4">
              {communities.map((community) => <CommunityCard key={community.id} community={community} profiles={profiles} />)}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">{t('community_none_found')}</p>
          )}
        </CardContent>
      </Card>
    );
}

function CommunitySearchResults({ searchTerm, profiles }: { searchTerm: string, profiles: CommunityProfile[] | undefined }) {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (!firestore || !searchTerm) {
            setCommunities([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const fetchCommunities = async () => {
            try {
                const q = query(
                    collection(firestore, 'communities'), 
                    where('name', '>=', searchTerm), 
                    where('name', '<=', searchTerm + '\uf8ff')
                );
                const snapshot = await getDocs(q);
                setCommunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community)));
            } catch (err: any) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCommunities();
    }, [searchTerm]);

    return (
        <CommunityList 
            title={t('community_search_results')}
            communities={communities}
            profiles={profiles}
            isLoading={isLoading}
            error={error}
        />
    )
}

function PublicCommunityList({ profiles }: { profiles: CommunityProfile[] | undefined }) {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (!firestore) return;
        setIsLoading(true);
        const fetchCommunities = async () => {
            try {
                const q = query(collection(firestore, 'communities'), orderBy('name', 'asc'));
                const snapshot = await getDocs(q);
                setCommunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community)));
            } catch (err: any) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCommunities();
    }, []);

    return (
        <CommunityList
            title={t('community_all_communities')}
            communities={communities}
            profiles={profiles}
            isLoading={isLoading}
            error={error}
        />
    )
}


export default function CommunityPage() {
  const { user, isUserLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [isLoadingUserCommunities, setIsLoadingUserCommunities] = useState(true);
  const [userCommunitiesError, setUserCommunitiesError] = useState<Error | null>(null);

  useEffect(() => {
      if (!user || !firestore) {
          setIsLoadingUserCommunities(false);
          return;
      }
      setIsLoadingUserCommunities(true);
      const fetchUserCommunities = async () => {
          try {
              const q = query(collection(firestore, 'communities'), where('ownerId', '==', user.uid));
              const snapshot = await getDocs(q);
              setUserCommunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community)));
          } catch (err: any) {
              setUserCommunitiesError(err);
          } finally {
              setIsLoadingUserCommunities(false);
          }
      };
      fetchUserCommunities();
  }, [user]);

  const [allProfiles, setAllProfiles] = useState<CommunityProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  useEffect(() => {
      if (!firestore) return;
      const fetchAllProfiles = async () => {
          try {
              const q = query(collection(firestore, 'community-profiles'));
              const snapshot = await getDocs(q);
              setAllProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityProfile)));
          } catch (err: any) {
              // Silently fail on profiles, not critical
          } finally {
              setIsLoadingProfiles(false);
          }
      };
      fetchAllProfiles();
  }, []);

  if (isUserLoading || isLoadingProfiles) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary font-headline">
          {t('community_page_title')}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{t('community_page_subtitle')}</p>
      </div>

      <div className="space-y-12">
        <Card>
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary"><Info /> {t('federation_what_is_title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{t('federation_documentation')}</p>
            </CardContent>
        </Card>

        {searchTerm ? (
            <CommunitySearchResults searchTerm={searchTerm} profiles={allProfiles} />
        ) : (
            <PublicCommunityList profiles={allProfiles} />
        )}
        
        <Separator />
        
        {user ? (
            <>
                <CreateCommunityForm />
                <Separator />
                <CommunityList 
                    title={t('community_your_communities')}
                    communities={userCommunities}
                    profiles={allProfiles}
                    isLoading={isLoadingUserCommunities}
                    error={userCommunitiesError}
                />
            </>
        ) : (
            <Card className="w-full text-center shadow-lg">
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
        )}
      </div>
    </main>
  );
}
