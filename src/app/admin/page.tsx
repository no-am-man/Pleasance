// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, ShieldCheck, AlertTriangle, CheckCircle, Bone, KeyRound } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { runMemberSync } from '../actions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


// This is a simple check. In a real-world app, this should be a secure custom claim.
export const FOUNDER_EMAIL = 'gg.el0ai.com@gmail.com';

type SyncResult = {
    communitiesScanned: number;
    membersSynced: number;
    issuesFixed: number;
};

const credentialsSchema = z.object({
  serviceAccountKey: z.string().min(1, 'Service account key cannot be empty.'),
});


function AdminDashboard() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [syncIsLoading, setSyncIsLoading] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [keyIsLoading, setKeyIsLoading] = useState(false);

    const credentialDocRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, '_private_admin_data', 'credentials');
    }, [firestore]);

    const { data: existingCredentials, isLoading: credentialsLoading } = useDoc(credentialDocRef);

    const form = useForm<z.infer<typeof credentialsSchema>>({
        resolver: zodResolver(credentialsSchema),
        defaultValues: { serviceAccountKey: '' },
    });

    useEffect(() => {
        if (existingCredentials) {
            // @ts-ignore - a bit of a hack to get the key into the form
            form.setValue('serviceAccountKey', existingCredentials.serviceAccountKeyBase64 || '');
        }
    }, [existingCredentials, form]);

    const handleSync = async () => {
        setSyncIsLoading(true);
        setSyncError(null);
        setSyncResult(null);

        try {
            const syncResult = await runMemberSync();
            if (syncResult.error) {
                setSyncError(syncResult.error);
            } else if (syncResult.data) {
                setSyncResult(syncResult.data);
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            setSyncError(`The synchronization process failed: ${message}`);
        }

        setSyncIsLoading(false);
    };

    const onSaveKey = async (values: z.infer<typeof credentialsSchema>) => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Firestore not available' });
            return;
        }
        setKeyIsLoading(true);
        try {
            const docRef = doc(firestore, '_private_admin_data', 'credentials');
            await setDoc(docRef, { serviceAccountKeyBase64: values.serviceAccountKey });
            toast({ title: 'Credentials Saved!', description: 'The service account key has been securely stored.' });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
            toast({ variant: 'destructive', title: 'Failed to Save Key', description: message });
        }
        setKeyIsLoading(false);
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Database Maintenance</CardTitle>
                <CardDescription>Run maintenance tasks to ensure data integrity across the federation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card className="bg-muted/50">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <KeyRound /> Service Account Credentials
                        </CardTitle>
                        <CardDescription>
                            Securely store the Base64-encoded service account key required for server-side AI actions like flag generation. This only needs to be set once.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSaveKey)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="serviceAccountKey"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Base64 Encoded Service Account Key</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder={credentialsLoading ? "Loading existing key..." : "Paste your Base64 encoded key here..."} 
                                                    {...field}
                                                    rows={4}
                                                    disabled={credentialsLoading || keyIsLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={keyIsLoading || credentialsLoading}>
                                    {keyIsLoading ? <LoaderCircle className="mr-2 animate-spin" /> : <ShieldCheck className="mr-2"/>}
                                    Save Key
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>


                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Bone /> Synchronize Community Members
                        </CardTitle>
                        <CardDescription>
                            This action scans all communities and synchronizes each human member's name, bio, and avatar with their master community profile. This fixes inconsistencies that can cause errors.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleSync} disabled={syncIsLoading}>
                            {syncIsLoading ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ShieldCheck className="mr-2 h-4 w-4" />
                            )}
                            Run Member Sync
                        </Button>
                    </CardContent>
                </Card>

                {syncError && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Synchronization Error</AlertTitle>
                        <AlertDescription>{syncError}</AlertDescription>
                    </Alert>
                )}
                {syncResult && (
                    <Alert variant="default" className="bg-green-500/10 border-green-500/50">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertTitle className="text-green-500">Synchronization Complete</AlertTitle>
                        <AlertDescription className="text-green-500/80">
                            <ul className="list-disc pl-5">
                                <li>Communities Scanned: {syncResult.communitiesScanned}</li>
                                <li>Total Members Synced: {syncResult.membersSynced}</li>
                                <li>Data Issues Fixed: {syncResult.issuesFixed}</li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
                <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
            </main>
        );
    }

    if (user?.email !== FOUNDER_EMAIL) {
        return (
            <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>This page is restricted to the federation founder.</CardDescription>
                    </CardHeader>
                </Card>
            </main>
        );
    }

    return (
        <main className="container mx-auto max-w-2xl py-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-primary">Admin Panel</h1>
                <p className="text-muted-foreground">Federation Maintenance Tools</p>
            </div>
            <AdminDashboard />
        </main>
    );
}
