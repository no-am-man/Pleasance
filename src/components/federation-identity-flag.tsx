
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
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

type Asset = {
  id: string;
  name: string;
  value: number;
  type: 'physical' | 'ip';
};

export function FederationIdentityFlag({ userId }: { userId: string }) {
  const firestore = useFirestore();

  const assetsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'assets');
  }, [firestore, userId]);

  const { data: assets, isLoading } = useCollection<Asset>(assetsQuery);

  const totalValue = useMemo(() => {
    if (!assets) return 0;
    return assets.reduce((sum, asset) => sum + asset.value, 0);
  }, [assets]);

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
        <Button variant="ghost" size="icon" className="h-auto p-1 rounded-md">
            <Info className="h-5 w-5 text-blue-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personal Financial Report</DialogTitle>
          <DialogDescription>
            A summary of all declared assets in this user's treasury.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assets && assets.length > 0 ? assets.map(asset => (
                        <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.name}</TableCell>
                            <TableCell className="text-right">${asset.value.toLocaleString()}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">No assets declared.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableHead>Total Value</TableHead>
                        <TableHead className="text-right font-bold">${totalValue.toLocaleString()}</TableHead>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
