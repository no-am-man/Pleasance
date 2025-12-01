
// src/components/CommunityValueFlag.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { LoaderCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from './ui/table';

type Member = {
  name: string;
  role: string;
  bio: string;
  type: 'AI' | 'human';
  avatarUrl?: string;
  userId?: string;
};

type Asset = {
  id: string;
  name: string;
  value: number;
  type: 'physical' | 'ip';
};

type MemberContribution = {
    userId: string;
    userName: string;
    totalValue: number;
}

export function CommunityValueFlag({ members }: { members: Member[] }) {
  const firestore = useFirestore();
  const [contributions, setContributions] = useState<MemberContribution[]>([]);
  const [totalCommunityValue, setTotalCommunityValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const humanMembers = useMemo(() => {
    return members.filter(m => m.type === 'human' && m.userId);
  }, [members]);

  useEffect(() => {
    if (!firestore || humanMembers.length === 0) {
        setIsLoading(false);
        setContributions([]);
        setTotalCommunityValue(0);
        return;
    }
    
    let isMounted = true;
    setIsLoading(true);

    const fetchAllContributions = async () => {
        try {
            const contributionPromises = humanMembers.map(async (member) => {
                const assetsRef = collection(firestore, 'users', member.userId!, 'assets');
                const assetSnapshot = await getDocs(assetsRef);
                const memberTotalValue = assetSnapshot.docs.reduce((sum, doc) => {
                    return sum + (doc.data() as Asset).value || 0;
                }, 0);
                return {
                    userId: member.userId!,
                    userName: member.name,
                    totalValue: memberTotalValue
                };
            });
            
            const resolvedContributions = await Promise.all(contributionPromises);

            if (isMounted) {
                const totalValue = resolvedContributions.reduce((sum, c) => sum + c.totalValue, 0);
                setContributions(resolvedContributions);
                setTotalCommunityValue(totalValue);
            }
        } catch (error) {
            console.error("Error fetching community contributions:", error);
            if (isMounted) {
                setContributions([]);
                setTotalCommunityValue(0);
            }
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    };

    fetchAllContributions();

    return () => { isMounted = false; };

  }, [firestore, humanMembers]);


  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-auto p-1 rounded-md">
            <Info className="h-5 w-5 text-blue-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Community Financial Report</DialogTitle>
          <DialogDescription>
            A summary of the total declared asset value from each member of this community.
          </DialogDescription>
        </DialogHeader>
         <div className="max-h-96 overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Total Contribution</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contributions && contributions.length > 0 ? contributions.map(c => (
                        <TableRow key={c.userId}>
                            <TableCell className="font-medium">{c.userName}</TableCell>
                            <TableCell className="text-right">${c.totalValue.toLocaleString()}</TableCell>
                        </TableRow>
                    )) : (
                         <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">No member contributions found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableHead>Total Community Value</TableHead>
                        <TableHead className="text-right font-bold">${totalCommunityValue.toLocaleString()}</TableHead>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
