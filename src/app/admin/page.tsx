// src/app/admin/page.tsx
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, ShieldCheck, AlertTriangle, CheckCircle, Bone, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { runMemberSync, seedPlatformData } from '../actions';
import { useTranslation } from '@/hooks/use-translation';

// This is a simple check. In a real-world app, this should be a secure custom claim.
export const FOUNDER_EMAIL = 'gg.el0ai.com@gmail.com';

type SyncResult = {
    communitiesScanned: number;
    membersSynced: number;
    issuesFixed: number;
};

function AdminDashboard() {
    const { t } = useTranslation();
    const [syncIsLoading, setSyncIsLoading] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

    const [seedIsLoading, setSeedIsLoading] = useState(false);
    const [seedError, setSeedError] = useState<string | null>(null);
    const [seedResult, setSeedResult] = useState<string | null>(null);

    const handleSync = async () => {
        setSyncIsLoading(true);
        setSyncError(null);
        setSyncResult(null);

        try {
            const result = await runMemberSync();
            if ('error' in result) {
                setSyncError(String(result.error));
            } else {
                setSyncResult(result as SyncResult);
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            setSyncError(`The synchronization process failed: ${message}`);
        }

        setSyncIsLoading(false);
    };

    const handleSeed = async () => {
        setSeedIsLoading(true);
        setSeedError(null);
        setSeedResult(null);

        try {
            const result = await seedPlatformData();
             if (typeof result === 'object' && result !== null && 'error' in result && result.error) {
                setSeedError(String(result.error));
            } else if (typeof result === 'object' && result !== null && 'message' in result && result.message) {
                setSeedResult(String(result.message));
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            setSeedError(`The seeding process failed: ${message}`);
        }

        setSeedIsLoading(false);
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>Run maintenance and debugging tasks for the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Database /> Seed Platform Data
                        </CardTitle>
                        <CardDescription>
                            This action will populate the Firestore database with initial data for the entire platform, including the public roadmap, a founding community, and the founder's profile. Run this once on a new database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleSeed} disabled={seedIsLoading}>
                            {seedIsLoading ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Database className="mr-2 h-4 w-4" />
                            )}
                            Seed Platform
                        </Button>
                         {seedError && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Seeding Error</AlertTitle>
                                <AlertDescription>{seedError}</AlertDescription>
                            </Alert>
                        )}
                        {seedResult && (
                            <Alert variant="default" className="mt-4 bg-green-500/10 border-green-500/50">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <AlertTitle className="text-green-500">Seeding Complete</AlertTitle>
                                <AlertDescription className="text-green-500/80">
                                   {seedResult}
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
    const { t } = useTranslation();

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
                        <CardDescription>This page is restricted to the application founder.</CardDescription>
                    </CardHeader>
                </Card>
            </main>
        );
    }

    return (
        <main className="container mx-auto max-w-2xl py-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-primary" data-testid="main-heading">{t('navAdmin')}</h1>
                <p className="text-muted-foreground">Application Maintenance Tools</p>
            </div>
            <AdminDashboard />
        </main>
    );
}
