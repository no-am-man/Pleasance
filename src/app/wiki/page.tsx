// src/app/wiki/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser, useMemoFirebase } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Info, FileText, PlusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';

type WikiPage = {
    id: string;
    title: string;
    lastModifiedAt: { seconds: number; nanoseconds: number; } | null;
    lastModifiedByUserName: string;
}

export default function WikiHomePage() {
    const { user } = useUser();
    const [searchTerm, setSearchTerm] = useState('');

    const wikiQuery = useMemoFirebase(() => query(collection(firestore, 'wiki'), orderBy('title', 'asc')), []);
    const [pages, isLoading, error] = useCollectionData<WikiPage>(wikiQuery, { idField: 'id' });

    const filteredPages = pages?.filter(page =>
        page.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3 font-headline">
                    <Info /> The Public Wiki
                </h1>
                <p className="text-lg text-muted-foreground mt-2">A collaborative guide to the principles and tools of this Federated Republic.</p>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Welcome to the Wiki</CardTitle>
                    <CardDescription>
                        This is a living document, created and maintained by the community. Browse existing pages, or create a new one to share your knowledge.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Input
                        type="text"
                        placeholder="Search pages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background"
                    />
                    {user && (
                        <Button asChild className="w-full sm:w-auto">
                            <Link href="/wiki/new">
                                <PlusCircle className="mr-2" />
                                Create New Page
                            </Link>
                        </Button>
                    )}
                </CardContent>
            </Card>

            {isLoading && (
                <div className="flex justify-center py-8">
                    <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
                </div>
            )}

            {error && (
                <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
                    <CardHeader>
                        <CardTitle>Error Loading Wiki</CardTitle>
                        <CardDescription>{error.message}</CardDescription>
                    </CardHeader>
                </Card>
            )}

            {!isLoading && filteredPages && (
                <div className="space-y-4">
                    {filteredPages.length > 0 ? (
                        filteredPages.map(page => (
                            <Link key={page.id} href={`/wiki/${page.id}`}>
                                <Card className="hover:bg-muted/50 transition-colors">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3 text-primary">
                                            <FileText /> {page.title}
                                        </CardTitle>
                                        <CardDescription>
                                            Last updated {page.lastModifiedAt ? formatDistanceToNow(new Date(page.lastModifiedAt.seconds * 1000), { addSuffix: true }) : 'a while ago'} by {page.lastModifiedByUserName}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No pages found.
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </main>
    );
}
