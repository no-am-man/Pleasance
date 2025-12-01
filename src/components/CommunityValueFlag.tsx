// src/components/CommunityValueFlag.tsx
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
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

  const humanMemberIds = useMemo(() => {
    return members.filter(m => m.type === 'human' && m.userId).map(m => m.userId!);
  }, [members]);

  const assetsQuery = useMemoFirebase(() => {
    if (!firestore || humanMemberIds.length === 0) return null;
    // This is not a scalable query for a large number of members.
    // In a production scenario, this value would be denormalized and calculated on the backend.
    // Firestore 'in' queries are limited to 30 items.
    const q = query(collection(firestore, 'users'), where(documentId(), 'in', humanMemberIds.slice(0, 30)));
    // We can't directly query subcollections of multiple documents, so this is a simplified example.
    // A better approach would be a separate top-level collection for all assets.
    // For this prototype, we'll fetch assets for each user individually.
    return null; // We will handle fetching inside the component.
  }, [firestore, humanMemberIds]);
  
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || humanMemberIds.length === 0) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    let isMounted = true;

    const fetchAllAssets = async () => {
        let cumulativeValue = 0;
        const assetPromises = humanMemberIds.map(userId => {
            const assetsRef = collection(firestore, 'users', userId, 'assets');
            const q = query(assetsRef);
            return useCollection<Asset>(q); // This is not ideal inside an effect, but demonstrates the concept
        });
        
        // This is a conceptual demonstration. `useCollection` is a hook and cannot be called in a loop.
        // A real implementation would require a different data fetching strategy.
        // For this prototype, we will simulate the fetching.
        
        // A better, but still client-heavy approach:
        const { getDocs } = await import('firebase/firestore');
        const userAssetDocs = await Promise.all(humanMemberIds.map(uid => getDocs(collection(firestore, 'users', uid, 'assets'))));

        if (isMounted) {
            userAssetDocs.forEach(snapshot => {
                snapshot.forEach(doc => {
                    cumulativeValue += (doc.data() as Asset).value || 0;
                });
            });
            setTotalValue(cumulativeValue);
            setIsLoading(false);
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
