// src/app/bugs/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useMemoFirebase } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle, LogIn, Bug, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

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
    
    setDocumentNonBlocking(newBugRef, newBug, { merge: false });
}

function AddBugForm() {
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof BugSchema>>({
        resolver: zodResolver(BugSchema),
        defaultValues: { title: '', description: '', priority: 'medium' },
    });

    async function onSubmit(data: z.infer<typeof BugSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Authenticated' });
            return;
        }
        setIsLoading(true);

        try {
            await submitBugReport(data, user);
            toast({ title: 'Bug Report Received', description: 'Thank you for your contribution.' });
            form.reset();
        } catch (e) {
             const message = e instanceof Error ? e.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Failed to submit bug report', description: message });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Submit a Bug Report</CardTitle>
                <CardDescription>Found an issue? Let us know so we can fix it.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 'Save button is unresponsive in the Altar of Creation'" {...field} />
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
                                    <FormLabel>Detailed Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Please provide steps to reproduce the issue..." {...field} rows={5} />
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
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select the priority level" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
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
                            Submit Report
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function BugList() {
    const bugsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'bugs'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const [bugs, isLoading, error] = useCollectionData<Bug>(bugsQuery, { idField: 'id' });

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
        return <p className="text-destructive text-center">Error loading bug reports: {error.message}</p>;
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Public Bug Tracker</CardTitle>
                <CardDescription>A list of all issues reported by the community.</CardDescription>
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
                                        <p>Reported by {bug.reporterName}</p>
                                        <p>{bug.createdAt ? formatDistanceToNow(new Date(bug.createdAt.seconds * 1000), { addSuffix: true }) : ''}</p>
                                    </div>
                                    <Badge variant={getPriorityVariant(bug.priority)} className="capitalize">{bug.priority}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No bugs have been reported. All is in harmony. 🙏</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function BugsPage() {
  const { user, isUserLoading } = useUser();

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
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <Bug /> Bug Tracker
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Help maintain the harmony of the project by reporting issues.</p>
      </div>

      <div className="space-y-8">
        {user ? (
            <AddBugForm />
        ) : (
            <Card className="w-full text-center shadow-lg">
                <CardHeader>
                    <CardTitle>Contribute to the Project</CardTitle>
                    <CardDescription>Log in to report a bug and help improve Pleasance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" /> Login to Submit a Report
                    </Link>
                    </Button>
                </CardContent>
            </Card>
        )}
        <BugList />
      </div>
    </main>
  );
}
