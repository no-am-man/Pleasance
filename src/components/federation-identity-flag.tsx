'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Shield, Gem, Crown, Star, LoaderCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-lg">
            <Icon className={`h-6 w-6 ${tier.color}`} />
            <span className={`font-semibold ${tier.color}`}>{tier.name} Contributor</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Total Treasury Value: ${totalValue.toLocaleString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
