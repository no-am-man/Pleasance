// src/components/CommunityValueFlag.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { LoaderCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import QRCode from 'react-qr-code';
import { Button } from './ui/button';
import { Banknote } from 'lucide-react';

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

export function CommunityValueFlag({ members }: { members: Member[] }) {
  const firestore = useFirestore();
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const humanMemberIds = useMemo(() => {
    return members.filter(m => m.type === 'human' && m.userId).map(m => m.userId!);
  }, [members]);

  useEffect(() => {
    if (!firestore || humanMemberIds.length === 0) {
        setIsLoading(false);
        setTotalValue(0);
        return;
    }
    
    let isMounted = true;
    setIsLoading(true);

    const fetchAllAssets = async () => {
        try {
            const assetPromises = humanMemberIds.map(uid => 
                getDocs(collection(firestore, 'users', uid, 'assets'))
            );
            
            const userAssetSnapshots = await Promise.all(assetPromises);

            if (isMounted) {
                let cumulativeValue = 0;
                userAssetSnapshots.forEach(snapshot => {
                    snapshot.forEach(doc => {
                        cumulativeValue += (doc.data() as Asset).value || 0;
                    });
                });
                setTotalValue(cumulativeValue);
            }
        } catch (error) {
            console.error("Error fetching community assets:", error);
            if (isMounted) {
                setTotalValue(0);
            }
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    };

    fetchAllAssets();

    return () => { isMounted = false; };

  }, [firestore, humanMemberIds]);


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
            <div className="flex items-center gap-2 text-sm font-mono text-primary">
                ${totalValue.toLocaleString()}
            </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-8 w-8" /> Community Treasury Token
          </DialogTitle>
          <DialogDescription>
            This token represents the total declared value of all member assets within this community.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
            <div className="bg-white p-4 rounded-lg">
                <QRCode
                    value={totalValue.toString()}
                    size={180}
                    level="Q"
                    viewBox={`0 0 180 180`}
                />
            </div>
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Community Value</p>
                <p className="text-3xl font-bold font-mono">${totalValue.toLocaleString()}</p>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
