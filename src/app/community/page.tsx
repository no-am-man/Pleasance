
// src/app/community/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, PlusCircle, LoaderCircle, Search } from "lucide-react";
import { createCommunityDetails } from "../actions";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CommunityValueFlag } from "@/components/CommunityValueFlag";

const FormSchema = z.object({
  prompt: z.string().min(10, "Please enter a prompt of at least 10 characters."),
});

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
  welcomeMessage: string;
  ownerId: string;
  members: Member[];
};

function CreateCommunityForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!user || !firestore) {
      setError("You must be logged in to create a community.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // 1. Call server action to get AI-generated details
      const result = await createCommunityDetails({ prompt: data.prompt });
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      
      const { name, description, welcomeMessage, members } = result;
      
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
      // The list will update automatically via the useCollection hook
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`Failed to create community. ${message}`);
    }
    setIsLoading(false);
  }

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Create a New Community</CardTitle>
        <CardDescription>Describe the community you want to create. What is its purpose? Who is it for?</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <textarea
              {...form.register("prompt")}
              placeholder="e.g., 'A community for amateur astronomers to share tips, photos, and organize stargazing events.'"
              className="w-full p-2 border rounded-md min-h-[100px] bg-background"
            />
            {form.formState.errors.prompt && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.prompt.message}</p>
            )}
          </div>
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
      </CardContent>
    </Card>
  );
}

function CommunityList({ title, communities, isLoading, error }: { title: string, communities: Community[] | null, isLoading: boolean, error: Error | null }) {
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
              {communities.map((community) => (
                <li key={community.id} className="rounded-md border transition-colors hover:bg-muted/50">
                   <Link href={`/community/${community.id}`} className="block p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg text-primary">{community.name}</h3>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                            <CommunityValueFlag members={community.members} />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{community.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No communities found.</p>
          )}
        </CardContent>
      </Card>
    );
}

function CommunitySearchResults({ searchTerm }: { searchTerm: string }) {
    const firestore = useFirestore();

    const searchCommunitiesQuery = useMemoFirebase(() => {
      if (!firestore || !searchTerm) return null;
      const communitiesRef = collection(firestore, 'communities');
      // A simple "startsWith" search. For full-text search, an external service like Algolia is better.
      return query(communitiesRef, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
    }, [firestore, searchTerm]);
  
    const { data: communities, isLoading, error } = useCollection<Community>(searchCommunitiesQuery);

    return (
        <CommunityList 
            title="Search Results"
            communities={communities}
            isLoading={isLoading}
            error={error}
        />
    )
}

function PublicCommunityList() {
    const firestore = useFirestore();

    const publicCommunitiesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'communities'), orderBy('name', 'asc'));
    }, [firestore]);

    const { data: communities, isLoading, error } = useCollection<Community>(publicCommunitiesQuery);

    return (
        <CommunityList
            title="All Communities"
            communities={communities}
            isLoading={isLoading}
            error={error}
        />
    )
}


export default function CommunityPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const userCommunitiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'communities'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: userCommunities, isLoading, error } = useCollection<Community>(userCommunitiesQuery);

  if (isUserLoading) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
          Community Federation
        </h1>
        <p className="text-lg text-muted-foreground">Create, manage, and discover co-learning communities.</p>
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
            <CommunitySearchResults searchTerm={searchTerm} />
        ) : (
            <PublicCommunityList />
        )}
        
        <Separator />
        
        {user ? (
            <>
                <CreateCommunityForm />
                <Separator />
                <CommunityList 
                    title="Your Communities"
                    communities={userCommunities}
                    isLoading={isLoading}
                    error={error}
                />
            </>
        ) : (
            <Card className="w-full text-center shadow-lg">
                <CardHeader>
                    <CardTitle>Join the Federation</CardTitle>
                    <CardDescription>Log in to create your own communities and see the ones you've founded.</CardDescription>
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
