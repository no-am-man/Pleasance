// src/app/fabrication/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle, PlusCircle, LogIn, Warehouse, ShoppingCart, Info, CheckCircle, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useUser } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, where, serverTimestamp, doc, getDocs } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

type Asset = {
    id: string;
    ownerId: string;
    name: string;
    description: string;
    type: 'physical' | 'virtual' | 'ip';
    value: number;
    createdAt: { seconds: number; nanoseconds: number; } | null;
    fileUrl?: string;
};

type FabricationOrder = {
    id: string;
    userId: string;
    assetId: string;
    assetName: string;
    fileUrl: string;
    supplier: string;
    status: 'pending' | 'in_progress' | 'completed' | 'shipped' | 'cancelled';
    cost: number;
    notes?: string;
    createdAt: any;
    updatedAt: any;
}

const OrderSchema = z.object({
  assetId: z.string().min(1, "You must select an asset to fabricate."),
  supplier: z.string().min(1, "Please select a supplier."),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional(),
});


function OrderList() {
    const { user } = useUser();
    const [orders, setOrders] = useState<FabricationOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user || !firestore) {
            setIsLoading(false);
            return;
        }

        const fetchOrders = async () => {
            try {
                const ordersQuery = query(collection(firestore, 'fabricationOrders'), where('userId', '==', user.uid));
                const snapshot = await getDocs(ordersQuery);
                const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FabricationOrder));
                setOrders(ordersData);
            } catch (err: any) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    const getStatusVariant = (status: FabricationOrder['status']) => {
        switch (status) {
            case 'completed':
            case 'shipped':
                return 'default';
            case 'in_progress':
                return 'secondary';
            case 'cancelled':
                return 'destructive'
            default:
                return 'outline';
        }
    }
    
    const getStatusIcon = (status: FabricationOrder['status']) => {
        switch (status) {
            case 'completed':
            case 'shipped':
                return <CheckCircle className="h-4 w-4" />;
            case 'in_progress':
                return <LoaderCircle className="h-4 w-4 animate-spin" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    }


    if (isLoading) {
        return <div className="flex justify-center p-8"><LoaderCircle className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <p className="text-destructive text-center">Error loading fabrication orders: {error.message}</p>;
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Your Fabrication Orders</CardTitle>
                <CardDescription>Track the status of your fabrication orders.</CardDescription>
            </CardHeader>
            <CardContent>
                {orders && orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="flex items-center gap-4 rounded-md border p-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold">{order.assetName}</h3>
                                    <p className="text-sm text-muted-foreground">Supplier: {order.supplier} | Cost: {order.cost > 0 ? `${order.cost.toLocaleString()} sats` : 'N/A'}</p>
                                </div>
                                <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1.5">
                                    {getStatusIcon(order.status)}
                                    <span className="capitalize">{order.status.replace('_', ' ')}</span>
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>You have no active fabrication orders.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


function NewOrderForm({ assets }: { assets: Asset[] }) {
    const { user } = useUser();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    const preselectedAssetId = searchParams.get('assetId');

    const form = useForm<z.infer<typeof OrderSchema>>({
        resolver: zodResolver(OrderSchema),
        defaultValues: { assetId: preselectedAssetId || '', supplier: 'NNO.Studio', notes: '' },
    });
    
    useEffect(() => {
        if (preselectedAssetId) {
            form.setValue('assetId', preselectedAssetId);
        }
    }, [preselectedAssetId, form]);

    async function onSubmit(data: z.infer<typeof OrderSchema>) {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: "Not Authenticated" });
            return;
        }

        const selectedAsset = assets.find(a => a.id === data.assetId);
        if (!selectedAsset || !selectedAsset.fileUrl) {
            toast({ variant: 'destructive', title: "Asset's data file not found." });
            return;
        }
        
        setIsLoading(true);

        try {
            const newOrderRef = doc(collection(firestore, 'fabricationOrders'));
            const newOrder: Omit<FabricationOrder, 'id'> = {
                userId: user.uid,
                assetId: selectedAsset.id,
                assetName: selectedAsset.name,
                fileUrl: selectedAsset.fileUrl,
                supplier: data.supplier,
                status: 'pending',
                cost: 0, // Supplier will update this
                notes: data.notes,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            setDocumentNonBlocking(newOrderRef, { ...newOrder, id: newOrderRef.id }, { merge: false });

            toast({ title: 'Order Submitted!', description: `Your request for "${selectedAsset.name}" has been created.` });
            form.reset();
        } catch (e) {
             const message = e instanceof Error ? e.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Failed to submit order', description: message });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit a Fabrication Order</CardTitle>
                <CardDescription>Select an asset from your Treasury to bring into the physical world.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="assetId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asset to Fabricate</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an asset from your Treasury..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {assets.filter(a => a.fileUrl).map(asset => (
                                                <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="supplier"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Supplier</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a supplier" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="NNO.Studio">NNO.Studio (3D Printing)</SelectItem>
                                            <SelectItem value="MiLaShem Publisher">MiLaShem Publisher (Print on Demand)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Instructions (Optional)</FormLabel>
                                <FormControl>
                                <Textarea placeholder="Any specific requirements for materials, colors, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading}>
                             {isLoading ? <LoaderCircle className="mr-2 animate-spin" /> : <ShoppingCart className="mr-2" />}
                            Submit Fabrication Request
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default function FabricationPage() {
  const { user, isUserLoading } = useUser();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAssetsLoading, setIsAssetsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
        setIsAssetsLoading(false);
        return;
    }
    
    const fetchAssets = async () => {
        try {
            const assetsQuery = query(collection(firestore, `users/${user.uid}/assets`));
            const snapshot = await getDocs(assetsQuery);
            setAssets(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Asset)));
        } catch (err: any) {
            // silent fail
        } finally {
            setIsAssetsLoading(false);
        }
    };
    
    fetchAssets();
  }, [user]);

  if (isUserLoading || isAssetsLoading) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </main>
    );
  }

  if (!user) {
    return (
        <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <CardTitle>Enter the Workshop</CardTitle>
                    <CardDescription>Log in to create and track fabrication orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" /> Login to Continue
                    </Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
  }
  
   if (!assets || assets.length === 0) {
    return (
      <main className="container mx-auto max-w-2xl py-8">
        <Card className="shadow-lg text-center">
          <CardHeader>
            <Info className="mx-auto h-12 w-12 text-primary" />
            <CardTitle>Your Treasury is Empty</CardTitle>
            <CardDescription>You must first add an asset in your Treasury before it can be fabricated.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/treasury">
                <PlusCircle className="mr-2 h-4 w-4" /> Go to Treasury
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3 font-headline">
          <Warehouse /> Workshop of Manifestation
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Create and track fabrication orders for your assets.</p>
      </div>
      <div className="space-y-8">
        <NewOrderForm assets={assets} />
        <OrderList />
      </div>
    </main>
  );
}
