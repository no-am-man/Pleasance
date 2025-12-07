// src/app/community/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc, collection, query, orderBy, serverTimestamp, where, arrayUnion, arrayRemove, updateDoc, getDoc, getDocs, setDoc, onSnapshot, Unsubscribe, addDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, ArrowLeft, Bot, User, PlusCircle, Send, MessageSquare, LogIn, Check, X, Hourglass, CheckCircle, Circle, Undo2, Ban, RefreshCw, Flag, Save, Download, Sparkles, Presentation, KanbanIcon, Info, LogOut, Wrench, Banknote, UserX, CornerDownRight, BookOpen, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Image from 'next/image';
import { generateCommunityFlagAction, welcomeNewMemberAction, notifyOwnerOfJoinRequestAction } from '@/app/actions';
import { addDocument } from '@/firebase/non-blocking-updates';
import { PresentationHall } from '@/components/community/PresentationHall';
import { JoinRequests } from '@/components/community/JoinRequests';
import { MemberCard } from '@/components/community/MemberCard';
import { useTranslation } from '@/hooks/use-translation';
import { useDynamicTranslation } from '@/hooks/use-dynamic-translation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Member, Community, Form, CommunityProfile, WikiArticle } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { marked } from 'marked';


function TextFormForm({ communityId, onFormSent }: { communityId: string, onFormSent: () => void }) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !user || !firestore) return;

        setIsSubmitting(true);
        
        const formsColRef = collection(firestore, `communities/${communityId}/forms`);
        
        const newForm = {
            communityId,
            originCommunityId: communityId, // Initially, origin is the current community
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userAvatarUrl: user.photoURL || undefined,
            type: 'text' as const,
            text: text.trim(),
            status: 'active' as const,
            createdAt: serverTimestamp(),
            audience: 'public' as const,
        };

        try {
            await addDocument(formsColRef, newForm);
            setText('');
            onFormSent();
        } catch (error) {
            const message = error instanceof Error ? error.message : t('community_page_unexpected_error');
            toast({ variant: 'destructive', title: t('community_page_send_message_fail_title'), description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('community_page_message_placeholder')}
                disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting || !text.trim()}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Send />}
            </Button>
        </form>
    );
}

function FormBubble({ form, allCommunities, onClick }: { form: Form; allCommunities: Community[]; onClick: () => void }) {
    const originCommunity = allCommunities.find(c => c.id === form.originCommunityId);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            whileHover={{ scale: 1.02, zIndex: 10 }}
            className="w-full max-w-lg mx-auto cursor-pointer -mt-8 first:mt-0"
            onClick={onClick}
        >
            <Card className="bg-card shadow-lg flex items-center gap-3 p-3">
                <Avatar className="w-10 h-10 border-2 border-background flex-shrink-0">
                    <AvatarImage src={form.userAvatarUrl || `https://i.pravatar.cc/150?u=${form.userId}`} alt={form.userName} />
                    <AvatarFallback>{form.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{form.userName}</span>
                        {form.communityId !== form.originCommunityId && originCommunity && (
                            <>
                                <CornerDownRight className="w-3 h-3" />
                                <span className="font-semibold truncate">{originCommunity.name}</span>
                            </>
                        )}
                    </div>
                    <p className="font-medium text-sm text-foreground mt-0.5 line-clamp-2">{form.text}</p>
                </div>
                 {originCommunity?.flagUrl && (
                    <div className="w-8 h-8 flex-shrink-0 relative">
                        <Image src={originCommunity.flagUrl} alt={`${originCommunity.name} Flag`} fill className="rounded-full object-cover border border-border" />
                    </div>
                )}
            </Card>
        </motion.div>
    );
}


function SphericalizingChatRoom({ communityId, isOwner, allMembers, allCommunities }: { communityId: string; isOwner: boolean, allMembers: Member[], allCommunities: Community[] }) {
    const { user } = useUser();
    const { t } = useTranslation();
    
    const [forms, setForms] = useState<Form[]>([]);
    const [visibleForms, setVisibleForms] = useState<Form[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore || !communityId) {
            setIsLoading(false);
            return () => {};
        }
        setIsLoading(true);
        setError(null);
        
        const formsQuery = query(collection(firestore, `communities/${communityId}/forms`), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(formsQuery, 
            (snapshot) => {
                const formsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Form));
                setForms(formsData);
                setIsLoading(false);
            }, 
            (err) => {
                const permissionError = new FirestorePermissionError({
                    path: `communities/${communityId}/forms`,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setError(err);
                setIsLoading(false);
            }
        );
        
        return unsubscribe;
    }, [communityId]);

    useEffect(() => {
        const filtered = forms.filter(form => form.audience !== 'owner' || isOwner);
        setVisibleForms(filtered);
    }, [forms, isOwner]);

    const handleBubbleClick = (formId: string) => {
        setVisibleForms(prev => prev.filter(f => f.id !== formId));
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">{t('community_page_ccn_title')}</CardTitle>
                        <CardDescription>{t('community_page_ccn_desc_spheres')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {user ? (
                    <div className="p-4 border-b">
                        <TextFormForm communityId={communityId} onFormSent={() => {}} />
                    </div>
                ) : (
                    <div className="p-4 text-center border-b">
                        <Button asChild>
                            <Link href="/login">
                                <LogIn className="mr-2" />
                                {t('community_page_login_to_message')}
                            </Link>
                        </Button>
                    </div>
                )}
                {isLoading && <LoaderCircle className="mx-auto animate-spin" />}
                {error && <p className="text-destructive">{t('community_page_load_messages_error', { message: error.message })}</p>}
                
                <div className="h-[500px] overflow-y-auto bg-muted/20 rounded-lg p-8 flex flex-col items-center">
                    <AnimatePresence>
                        {visibleForms?.map(form => {
                            const key = form.id || `${form.userId}-${form.createdAt?.seconds || Date.now()}`;
                            return <FormBubble key={key} form={form} allCommunities={allCommunities} onClick={() => handleBubbleClick(form.id)} />
                        })}
                    </AnimatePresence>
                    {!isLoading && visibleForms && visibleForms.length === 0 && <p className="flex items-center justify-center text-muted-foreground text-center h-full">{t('community_page_no_messages')}</p>}
                </div>
            </CardContent>
        </Card>
    )
}

const WikiArticleSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    content: z.string().min(20, "Content must be at least 20 characters."),
});

function WikiArticleForm({ communityId, onArticleAdded }: { communityId: string, onArticleAdded: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const form = useForm<z.infer<typeof WikiArticleSchema>>({
        resolver: zodResolver(WikiArticleSchema),
        defaultValues: { title: '', content: '' },
    });

    async function onSubmit(data: z.infer<typeof WikiArticleSchema>) {
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

function WikiTabContent({ communityId, isOwner }: { communityId: string, isOwner: boolean }) {
    const [articles, setArticles] = useState<WikiArticle[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    const fetchArticles = useCallback(() => {
        if (!firestore || !communityId) return; // No-op if firestore/id not ready
        setIsLoading(true);
        const q = query(collection(firestore, `communities/${communityId}/wiki`), orderBy('title', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WikiArticle));
            setArticles(fetchedArticles);
            setIsLoading(false);
        }, (err) => {
            setError(err);
            setIsLoading(false);
        });
        return unsubscribe;
    }, [communityId]);
    
    useEffect(() => {
        const unsubscribe = fetchArticles();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [fetchArticles]);
    
    useEffect(() => {
        if (articles.length > 0 && !articles.some(a => a.id === selectedArticle?.id)) {
            setSelectedArticle(articles[0]);
        }
    }, [articles, selectedArticle]);
    

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
    
    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
        return <p className="text-destructive text-center">Error loading wiki: {error.message}</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                <WikiArticleForm communityId={communityId} onArticleAdded={fetchArticles} />
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
    )
}
