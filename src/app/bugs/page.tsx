// src/app/bugs/page.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useMemoFirebase, getFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, setDoc, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle, LogIn, Bug, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';

const BugSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  priority: z.enum(['low', 'medium', 'high']),
});

type Bug = {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'new' | 'in_progress' | 'done' | 'wont_fix';
    reporterId: string;
    reporterName: string;
    createdAt: { seconds: number; nanoseconds: number; } | null;
}

async function submitBugReport(values: z.infer<typeof BugSchema>, user: { uid: string, displayName: string | null }) {
    const { firestore } = getFirebase();
    if (!firestore) {
        throw new Error("Firestore is not initialized");
    }
    const newBugRef = doc(collection(firestore, 'bugs'));
    const newBug = {
        id: newBugRef.id,
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: 'new' as const,
        reporterId: user.uid,
        reporterName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
    };
    
    await setDoc(newBugRef, newBug);
}

function AddBugForm({ onBugAdded }: { onBugAdded: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    const form = useForm<z.infer<typeof BugSchema>>({
        resolver: zodResolver(BugSchema),
        defaultValues: { title: '', description: '', priority: 'medium' },
    });

    async function onSubmit(data: z.infer<typeof BugSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: t('bug_tracker_toast_not_authenticated') });
            return;
        }
        setIsLoading(true);

        try {
            await submitBugReport(data, user);
            toast({ title: t('bug_tracker_toast_report_received'), description: t('bug_tracker_toast_thank_you') });
            form.reset();
            onBugAdded(); // Call the callback to trigger a refresh
        } catch (e) {
             const message = e instanceof Error ? e.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: t('bug_tracker_toast_submit_failed_title'), description: message });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{t('bug_tracker_submit_form_title')}</CardTitle>
                <CardDescription>{t('bug_tracker_submit_form_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('bug_tracker_form_title_label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('bug_tracker_form_title_placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('bug_tracker_form_desc_label')}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t('bug_tracker_form_desc_placeholder')} {...field} rows={5} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('bug_tracker_form_priority_label')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('bug_tracker_form_priority_placeholder')} />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="low">{t('bug_tracker_priority_low')}</SelectItem>
                                    <SelectItem value="medium">{t('bug_tracker_priority_medium')}</SelectItem>
                                    <SelectItem value="high">{t('bug_tracker_priority_high')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <PlusCircle className="mr-2 h-4 w-4" />
                            )}
                            {t('bug_tracker_submit_report_button')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function BugList({ bugs, isLoading, error }: { bugs: Bug[], isLoading: boolean, error: Error | null }) {
    const { t } = useTranslation();
    const getStatusVariant = (status: Bug['status']) => {
        switch (status) {
            case 'done': return 'default';
            case 'in_progress': return 'secondary';
            case 'wont_fix': return 'destructive';
            default: return 'outline';
        }
    }

    const getPriorityVariant = (priority: Bug['priority']) => {
        switch (priority) {
            case 'high': return 'destructive';
            case 'medium': return 'secondary';
            default: return 'default';
        }
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoaderCircle className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <p className="text-destructive text-center">{t('bug_tracker_error_loading_reports', { message: error.message })}</p>;
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{t('bug_tracker_list_title')}</CardTitle>
                <CardDescription>{t('bug_tracker_list_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                {bugs && bugs.length > 0 ? (
                    <div className="space-y-4">
                        {bugs.map(bug => (
                            <div key={bug.id} className="rounded-md border p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold">{bug.title}</h3>
                                    <Badge variant={getStatusVariant(bug.status)} className="capitalize">{bug.status.replace('_', ' ')}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{bug.description}</p>
                                <div className="flex justify-between items-end text-xs text-muted-foreground">
                                    <div>
                                        <p>{t('bug_tracker_reported_by', { name: bug.reporterName })}</p>
                                        <p>{bug.createdAt ? formatDistanceToNow(new Date(bug.createdAt.seconds * 1000), { addSuffix: true }) : ''}</p>
                                    </div>
                                    <Badge variant={getPriorityVariant(bug.priority)} className="capitalize">{bug.priority}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>{t('bug_tracker_no_bugs')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function BugsPage() {
  const { user, isUserLoading } = useUser();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [isLoadingBugs, setIsLoadingBugs] = useState(true);
  const [errorBugs, setErrorBugs] = useState<Error | null>(null);
  const { t } = useTranslation();

  const fetchBugs = useCallback(async () => {
    if (isUserLoading) return;
    const { firestore } = getFirebase();
    if (!firestore) return;
    setIsLoadingBugs(true);
    try {
        const bugsQuery = query(collection(firestore, 'bugs'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(bugsQuery);
        const bugsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bug));
        setBugs(bugsData);
    } catch (err: any) {
        setErrorBugs(err);
    } finally {
        setIsLoadingBugs(false);
    }
  }, [isUserLoading, getFirebase]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

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
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3" data-testid="main-heading">
          <Bug /> {t('bug_tracker_page_title')}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{t('bug_tracker_page_subtitle')}</p>
      </div>

      <div className="space-y-8">
        {user ? (
            <AddBugForm onBugAdded={fetchBugs} />
        ) : (
            <Card className="w-full text-center shadow-lg">
                <CardHeader>
                    <CardTitle>{t('bug_tracker_login_card_title')}</CardTitle>
                    <CardDescription>{t('bug_tracker_login_card_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" /> {t('bug_tracker_login_button')}
                    </Link>
                    </Button>
                </CardContent>
            </Card>
        )}
        <BugList bugs={bugs} isLoading={isLoadingBugs} error={errorBugs} />
      </div>
    </main>
  );
}
