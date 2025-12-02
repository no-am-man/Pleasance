// src/app/admin/page.tsx
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, ShieldCheck, AlertTriangle, CheckCircle, Bone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { runMemberSync } from '../actions';

// This is a simple check. In a real-world app, this should be a secure custom claim.
const FOUNDER_EMAIL = 'gg.el0ai.com@gmail.com';

type SyncResult = {
    communitiesScanned: number;
    membersSynced: number;
    issuesFixed: number;
};

function AdminDashboard() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SyncResult | null>(null);

    const handleSync = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const syncResult = await runMemberSync();
            if (syncResult.error) {
                setError(syncResult.error);
            } else if (syncResult.data) {
                setResult(syncResult.data);
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`The synchronization process failed: ${message}`);
        }

        setIsLoading(false);
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
                           <Bone /> Synchronize Community Members
                        </CardTitle>
                        <CardDescription>
                            This action scans all communities and synchronizes each human member's name, bio, and avatar with their master community profile. This fixes inconsistencies, such as missing avatar URLs, that can cause errors.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleSync} disabled={isLoading}>
                            {isLoading ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ShieldCheck className="mr-2 h-4 w-4" />
                            )}
                            Run Member Sync
                        </Button>
                    </CardContent>
                </Card>

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Synchronization Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {result && (
                    <Alert variant="default" className="bg-green-500/10 border-green-500/50">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertTitle className="text-green-500">Synchronization Complete</AlertTitle>
                        <AlertDescription className="text-green-500/80">
                            <ul className="list-disc pl-5">
                                <li>Communities Scanned: {result.communitiesScanned}</li>
                                <li>Total Members Synced: {result.membersSynced}</li>
                                <li>Data Issues Fixed: {result.issuesFixed}</li>
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
