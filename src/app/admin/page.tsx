
// src/app/admin/page.tsx
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, ShieldCheck, AlertTriangle, CheckCircle, Bone, List, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { runMemberSync, listAvailableModels } from '../actions';
import { useToast } from '@/hooks/use-toast';
import type { Model } from 'genkit/models';

// This is a simple check. In a real-world app, this should be a secure custom claim.
export const FOUNDER_EMAIL = 'gg.el0ai.com@gmail.com';

type SyncResult = {
    communitiesScanned: number;
    membersSynced: number;
    issuesFixed: number;
};

function ModelLister() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [models, setModels] = useState<Model[] | null>(null);
    const { toast } = useToast();

    const handleListModels = async () => {
        setIsLoading(true);
        setError(null);
        setModels(null);
        
        const result = await listAvailableModels();
        
        if (result.error) {
            setError(result.error);
        } else if (result.data) {
            setModels(result.data);
        }
        
        setIsLoading(false);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
          title: "Copied to Clipboard!",
          description: `The model name "${text}" has been copied.`,
        });
      };

    return (
         <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <List /> List Available Models
                </CardTitle>
                <CardDescription>
                    This action queries Genkit to discover all AI models available through the configured plugins. Use this to find the correct identifier for a model.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleListModels} disabled={isLoading}>
                    {isLoading ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <List className="mr-2 h-4 w-4" />
                    )}
                    List Models
                </Button>
                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error Listing Models</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {models && (
                    <div className="mt-4">
                        <h4 className="font-semibold mb-2">Available Models:</h4>
                        <div className="space-y-2 rounded-md border p-4 bg-background">
                            {models.map(model => (
                                <div key={model.name} className="flex items-center justify-between text-sm font-mono bg-muted/50 p-2 rounded">
                                    <span>{model.name}</span>
                                    <Button size="icon" variant="ghost" onClick={() => handleCopy(model.name)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AdminDashboard() {
    const [syncIsLoading, setSyncIsLoading] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

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

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>Run maintenance and debugging tasks for the federation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <ModelLister />
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Bone /> Synchronize Community Members
                        </CardTitle>
                        <CardDescription>
                            This action scans all communities and synchronizes each human member's name, bio, and avatar with their master community profile. This fixes data inconsistencies.
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
                         {syncError && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Synchronization Error</AlertTitle>
                                <AlertDescription>{syncError}</AlertDescription>
                            </Alert>
                        )}
                        {syncResult && (
                            <Alert variant="default" className="mt-4 bg-green-500/10 border-green-500/50">
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

    