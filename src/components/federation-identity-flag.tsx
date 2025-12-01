'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Shield, Gem, Crown, Star, LoaderCircle, QrCode } from 'lucide-react';
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

type Asset = {
  id: string;
  name: string;
  value: number;
  type: 'physical' | 'ip';
};

const tiers = [
  { threshold: 0, name: 'Bronze', icon: Shield, color: 'text-yellow-700' },
  { threshold: 1000, name: 'Silver', icon: Gem, color: 'text-gray-400' },
  { threshold: 10000, name: 'Gold', icon: Crown, color: 'text-yellow-500' },
  { threshold: 100000, name: 'Platinum', icon: Star, color: 'text-cyan-400' },
];

export function FederationIdentityFlag({ userId }: { userId: string }) {
  const firestore = useFirestore();

  const assetsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'assets');
  }, [firestore, userId]);

  const { data: assets, isLoading } = useCollection<Asset>(assetsQuery);

  const { totalValue, tier } = useMemo(() => {
    if (!assets) {
      return { totalValue: 0, tier: tiers[0] };
    }
    const total = assets.reduce((sum, asset) => sum + asset.value, 0);
    const currentTier = tiers.slice().reverse().find(t => total >= t.threshold) || tiers[0];
    return { totalValue: total, tier: currentTier };
  }, [assets]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        <span className="text-sm">Calculating Identity...</span>
      </div>
    );
  }

  const Icon = tier.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-auto p-1 rounded-md">
            <div className="flex items-center gap-2 text-lg">
                <Icon className={`h-6 w-6 ${tier.color}`} />
                <span className={`font-semibold ${tier.color}`}>{tier.name} Contributor</span>
            </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-6 w-6 ${tier.color}`} /> {tier.name} Identity Token
          </DialogTitle>
          <DialogDescription>
            This token represents the total declared value of this user's assets within the federation. Scan the QR code to verify its value.
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
                <p className="text-sm text-muted-foreground">Total Treasury Value</p>
                <p className="text-3xl font-bold font-mono">${totalValue.toLocaleString()}</p>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
