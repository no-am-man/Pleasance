
'use client';

import { useEffect, useState } from 'react';
import { firestore } from '@/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoaderCircle, Trophy } from 'lucide-react';
import Link from 'next/link';
import { BronzeMedal, SilverMedal, GoldMedal, PlatinumMedal } from './icons/medals';
import { SatoshiIcon } from './icons/satoshi-icon';


type LeaderboardEntry = {
    userId: string;
    userName: string;
    score: number;
    avatarUrl?: string;
    lastActivity: any;
};

const Medal = ({ rank }: { rank: number }) => {
    switch (rank) {
        case 1:
            return <PlatinumMedal className="h-8 w-8" />;
        case 2:
            return <GoldMedal className="h-8 w-8" />;
        case 3:
            return <SilverMedal className="h-8 w-8" />;
        case 4:
            return <BronzeMedal className="h-8 w-8" />;
        default:
            return <div className="w-8 h-8 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</div>;
    }
}


export default function Leaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore) return;
        const fetchLeaderboard = async () => {
            try {
                const leaderboardQuery = query(collection(firestore, 'leaderboard'), orderBy('score', 'desc'), limit(10));
                const snapshot = await getDocs(leaderboardQuery);
                const entriesData = snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as LeaderboardEntry));
                setEntries(entriesData);
            } catch (err: any) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                    <Trophy /> Scribe Rankings
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                    Your intellectual creations have value. Earn Satoshis (<SatoshiIcon className="w-3.5 h-3.5 inline-block" />) for every story you generate, where 1 Satoshi is pegged to $1 USD.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center p-8">
                        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}
                {error && <p className="text-destructive text-center">Error loading rankings: {error.message}</p>}
                {!isLoading && !error && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Rank</TableHead>
                                <TableHead>Scribe</TableHead>
                                <TableHead className="text-right flex items-center justify-end gap-1.5">Score <SatoshiIcon className="w-4 h-4" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries?.map((entry, index) => (
                                <TableRow key={entry.userId}>
                                    <TableCell>
                                        <Medal rank={index + 1} />
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/profile/${entry.userId}`} className="flex items-center gap-3 group">
                                            <Avatar>
                                                <AvatarImage src={entry.avatarUrl || `https://i.pravatar.cc/150?u=${entry.userId}`} />
                                                <AvatarFallback>{entry.userName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium group-hover:underline">{entry.userName}</span>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-lg text-primary flex items-center justify-end gap-1">{entry.score.toLocaleString()} <SatoshiIcon className="w-5 h-5" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                {!isLoading && entries?.length === 0 && <p className="text-center text-muted-foreground py-4">The leaderboard is empty. Be the first to earn a score!</p>}
            </CardContent>
        </Card>
    );
}
