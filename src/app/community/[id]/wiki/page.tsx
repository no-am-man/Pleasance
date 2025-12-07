
// src/app/community/[id]/wiki/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc, collection, query, orderBy, onSnapshot, Unsubscribe, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle, BookOpen, PlusCircle, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { marked } from 'marked';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { WikiArticle } from '@/lib/types';


const ArticleSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    content: z.string().min(20, "Content must be at least 20 characters."),
});

function ArticleForm({ communityId, onArticleAdded }: { communityId: string, onArticleAdded: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const form = useForm<z.infer<typeof ArticleSchema>>({
        resolver: zodResolver(ArticleSchema),
        defaultValues: { title: '', content: '' },
    });

    async function onSubmit(data: z.infer<typeof ArticleSchema>) {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'You must be logged in.' });
            return;
        }
        setIsLoading(true);

        try {
            const articlesColRef = collection(firestore, `communities/${communityId}/wiki`);
            await addDoc(articlesColRef, {
                ...data,
                authorId: user.uid,
                authorName: user.displayName || 'Anonymous',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast({ title: "Article Added", description: `"${data.title}" has been added to the wiki.` });
            form.reset();
            onArticleAdded();
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unexpected error occurred';
            toast({ variant: 'destructive', title: 'Failed to add article', description: message });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Create New Wiki Article</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <Input {...form.register('title')} placeholder="Article Title" />
                    <Textarea {...form.register('content')} placeholder="Article content (Markdown supported)..." rows={8} />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <LoaderCircle className="mr-2 animate-spin" /> : <PlusCircle className="mr-2" />}
                        Create Article
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function CommunityWikiPage() {
    const params = useParams();
    const communityId = params.id as string;
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    
    const [articles, setArticles] = useState<WikiArticle[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const isOwner = user?.uid === 'YOUR_OWNER_ID_LOGIC_HERE'; // Replace with actual owner logic

    useEffect(() => {
        if (!communityId || !firestore) {
            setIsLoading(false);
            return;
        }

        const q = query(collection(firestore, `communities/${communityId}/wiki`), orderBy('title', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WikiArticle));
            setArticles(fetchedArticles);
            // If no article is selected, or selected one is deleted, select the first.
            if (!selectedArticle || !fetchedArticles.find(a => a.id === selectedArticle.id)) {
                setSelectedArticle(fetchedArticles[0] || null);
            }
            setIsLoading(false);
        }, (err) => {
            const permissionError = new FirestorePermissionError({
                path: `communities/${communityId}/wiki`,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setError(err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [communityId, selectedArticle]);
    
    const handleDeleteArticle = async (articleId: string) => {
        if (!communityId || !firestore) return;
        const docRef = doc(firestore, `communities/${communityId}/wiki/${articleId}`);
        try {
            await deleteDoc(docRef);
            toast({ title: 'Article Deleted' });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Failed to delete article', description: message });
        }
    };

    if (isLoading || isUserLoading) {
        return (
            <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
                <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
            </main>
        );
    }
    
    return (
        <main className="container mx-auto min-h-screen max-w-6xl py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Button asChild variant="ghost">
                    <Link href={`/community/${communityId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Community
                    </Link>
                </Button>
            </div>
            <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
                    <BookOpen /> Community Wiki
                </h1>
                <p className="text-lg text-muted-foreground mt-2">A shared knowledge base for members.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1">
                    <ArticleForm communityId={communityId} onArticleAdded={() => { /* list will auto-update */ }} />
                     <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Articles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {articles.map(article => (
                                    <li key={article.id}>
                                        <button 
                                            className={`w-full text-left p-2 rounded-md transition-colors ${selectedArticle?.id === article.id ? 'bg-primary/20' : 'hover:bg-accent/50'}`}
                                            onClick={() => setSelectedArticle(article)}
                                        >
                                            {article.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-3">
                    <Card className="min-h-[60vh]">
                        {selectedArticle ? (
                            <>
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
                                    <CardDescription>
                                        By {selectedArticle.authorName} on {selectedArticle.createdAt ? new Date(selectedArticle.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                    </CardDescription>
                                </div>
                                 {isOwner && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete "{selectedArticle.title}".</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteArticle(selectedArticle.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(selectedArticle.content) }} />
                            </CardContent>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                                <BookOpen className="w-16 h-16 mb-4" />
                                <h3 className="text-lg font-semibold">Welcome to the Wiki</h3>
                                <p>Select an article to read or create a new one to get started.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </main>
    );
}

