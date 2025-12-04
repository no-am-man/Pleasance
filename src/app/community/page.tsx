

// src/app/community/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useUser, useMemoFirebase } from "@/firebase";
import { firestore } from "@/firebase/config";
import { collection, doc, query, where, orderBy, onSnapshot, Unsubscribe, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, PlusCircle, LoaderCircle, Search, User, Flag, Sparkles, Users } from "lucide-react";
import { createCommunityDetails, refineCommunityPromptAction } from "../actions";
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
};

function CreateCommunityForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: "",
      includeAiAgents: true,
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!user) {
      setError("You must be logged in to create a community.");
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
        title: 'Prompt is required',
        description: 'Please enter an idea before refining with AI.',
      });
      return;
    }
    setIsRefining(true);
    const result = await refineCommunityPromptAction({ prompt });
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'AI Refinement Failed',
        description: result.error,
      });
    } else if (result.refinedPrompt) {
      form.setValue('prompt', result.refinedPrompt, { shouldValidate: true });
      toast({
        title: 'Idea Refined!',
        description: 'The AI has expanded on your idea.',
      });
    }
    setIsRefining(false);
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Create a New Community</CardTitle>
        <CardDescription>Describe the community you wish to bring into being. What is its purpose?</CardDescription>
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
                                <FormLabel>Community Vision</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="e.g., 'A community for devout astronomers to share celestial findings, photography, and organize stargazing vigils.'"
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
                                <p>Refine with AI</p>
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
                      Create with AI Agents
                    </FormLabel>
                    <CardDescription>
                      Automatically generate a few AI members to help guide the conversation.
                    </CardDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                </>
                ) : (
                <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Community
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

function CommunityList({ title, communities, profiles, isLoading, error }: { title: string, communities: Community[] | undefined, profiles: CommunityProfile[] | undefined, isLoading: boolean, error: Error | null }) {
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
              {communities.map((community) => {
                const owner = profiles?.find(p => p.userId === community.ownerId);
                const members = community.members || [];
                return (
                    <li key={community.id} className="rounded-md border transition-colors hover:bg-muted/50 p-4">
                        <Link href={`/community/${community.id}`} className="block">
                            <div className="flex items-start gap-4">
                                <div className="relative h-20 w-36 flex-shrink-0 rounded-md border bg-muted flex items-center justify-center">
                                    {community.flagUrl ? (
                                        <Image src={community.flagUrl} alt={`${community.name} Flag`} layout="fill" objectFit="cover" className="rounded-md" />
                                    ) : (
                                        <Flag className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-primary underline">{community.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{community.description}</p>
                                    {owner && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold mt-2">
                                            <User className="w-4 h-4" />
                                            <span>Founded by {owner.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Meet the Members ({members.length})</h4>
                            <div className="space-y-3">
                                {members.slice(0, 5).map((member, index) => (
                                    <div key={member.userId || index} className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border-2 border-background">
                                            <AvatarImage src={member.avatarUrl || `https://i.pravatar.cc/150?u=${member.userId || member.name}`} />
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">{member.name}</p>
                                            <p className="text-xs text-muted-foreground">{member.bio}</p>
                                        </div>
                                    </div>
                                ))}
                                {members.length > 5 && (
                                    <p className="text-xs text-muted-foreground font-semibold">...and {members.length - 5} more</p>
                                )}
                            </div>
                        </div>
                    </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No communities found.</p>
          )}
        </CardContent>
      </Card>
    );
}

function CommunitySearchResults({ searchTerm, profiles }: { searchTerm: string, profiles: CommunityProfile[] | undefined }) {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

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
            title="Search Results"
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
            title="All Communities"
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
          FederalCommunitySocial
        </h1>
        <p className="text-lg text-muted-foreground">Create, manage, and discover communities.</p>
      </div>

      <div className="space-y-12">
        <Card>
            <CardHeader>
                <CardTitle>Find a Community</CardTitle>
                <CardDescription>Search for communities to join or browse the list below.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by community name..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
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
                    title="Communities You've Created"
                    communities={userCommunities}
                    profiles={allProfiles}
                    isLoading={isLoadingUserCommunities}
                    error={userCommunitiesError}
                />
            </>
        ) : (
            <Card className="w-full text-center shadow-lg">
                <CardHeader>
                    <CardTitle>Join/Enter the Federation</CardTitle>
                    <CardDescription>Log in to create your own communities and see the ones you've created.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" /> Login to Create & Manage
                    </Link>
                    </Button>
                </CardContent>
            </Card>
        )}
      </div>
    </main>
  );
}
