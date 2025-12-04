
// src/app/treasury/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, where, serverTimestamp, doc, getDocs } from 'firebase/firestore';
import { declareAssetWithFile } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle, LogIn, Coins, BrainCircuit, Box, PlusCircle, Eye, Warehouse, Upload, FileArchive, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { SatoshiIcon } from '@/components/icons/satoshi-icon';

const AssetSchema = z.object({
  name: z.string().min(2, 'Asset name must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.').max(500, 'Description cannot exceed 500 characters.'),
  type: z.enum(['physical', 'virtual', 'ip'], { required_error: 'Please select an asset type.' }),
  value: z.coerce.number().min(0, 'Value must be a positive number.'),
  file: z.any().optional(),
});

type Asset = z.infer<typeof AssetSchema> & {
    id: string;
    ownerId: string;
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


function AddAssetForm() {
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof AssetSchema>>({
        resolver: zodResolver(AssetSchema),
        defaultValues: { name: '', description: '', type: 'physical', value: 0 },
    });

    async function onSubmit(data: z.infer<typeof AssetSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to add an asset.' });
            return;
        }
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('userId', user.uid);
            formData.append('name', data.name);
            formData.append('description', data.description);
            formData.append('type', data.type);
            formData.append('value', data.value.toString());
            if (data.file && data.file.length > 0) {
                formData.append('file', data.file[0]);
            }

            const result = await declareAssetWithFile(formData);

            if (result.error) {
                throw new Error(result.error);
            }

            toast({
                title: 'Asset Added!',
                description: `${data.name} has been added to your Treasury.`,
            });
            form.reset();

        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Failed to add asset', description: message });
        } finally {
            setIsLoading(false);
        }
    }

    const fileRef = form.register("file");

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Declare a New Asset</CardTitle>
                <CardDescription>Add a physical or intellectual asset to your personal treasury. You can upload a data file (e.g., .stl, .obj, .pdf) for fabrication.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Asset Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Custom 3D Printed Chalice" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">Asset Value <SatoshiIcon className="w-4 h-4" /></FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="10000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asset Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe your asset, its value, or its purpose." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Asset Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select the type of asset" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        <SelectItem value="physical">Physical</SelectItem>
                                        <SelectItem value="virtual">Virtual</SelectItem>
                                        <SelectItem value="ip">Intellectual Property</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="file"
                                render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Data File (Optional)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="file" {...fileRef} className="pl-12" />
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground">
                                                    <Upload className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <PlusCircle className="mr-2 h-4 w-4" />
                            )}
                            Add Asset to Treasury
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function AssetList() {
    const { user } = useUser();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user || !firestore) {
            setIsLoading(false);
            return;
        };

        const fetchAssets = async () => {
            try {
                const assetsQuery = query(collection(firestore, 'users', user.uid, 'assets'));
                const snapshot = await getDocs(assetsQuery);
                const assetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
                setAssets(assetsData);
            } catch (err: any) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssets();
    }, [user]);

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoaderCircle className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <p className="text-destructive text-center">Error loading assets: {error.message}</p>;
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Your Declared Assets</CardTitle>
                <CardDescription>A list of your physical and intellectual assets.</CardDescription>
            </CardHeader>
            <CardContent>
                {assets && assets.length > 0 ? (
                    <div className="space-y-4">
                        {assets.map(asset => {
                            const isViewableVirtualAsset = (asset.type === 'virtual' || asset.type === 'ip') && asset.fileUrl && asset.fileUrl.endsWith('.json');
                            const isFabricatable = !!asset.fileUrl;
                            return (
                                <div key={asset.id} className="flex flex-col sm:flex-row items-start gap-4 rounded-md border p-4">
                                    {asset.type === 'physical' ? <Box className="h-8 w-8 text-primary mt-1 flex-shrink-0" /> : <BrainCircuit className="h-8 w-8 text-primary mt-1 flex-shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold">{asset.name}</h3>
                                            <div className="flex items-center gap-1 font-mono text-primary font-bold text-lg whitespace-nowrap pl-4">
                                                <span>{asset.value.toLocaleString()}</span>
                                                <SatoshiIcon className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{asset.description}</p>
                                    </div>
                                    <div className="flex gap-2 self-start sm:self-center flex-shrink-0">
                                        {isViewableVirtualAsset && (
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/svg3d?assetUrl=${encodeURIComponent(asset.fileUrl!)}`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </Link>
                                            </Button>
                                        )}
                                        {isFabricatable && (
                                            <Button asChild variant="secondary" size="sm">
                                                <Link href={`/fabrication?assetId=${asset.id}`}>
                                                    <Warehouse className="mr-2 h-4 w-4" />
                                                    Fabricate
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Your treasury is empty.</p>
                        <p>Declare your first asset using the form above.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

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
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">Supplier: {order.supplier} | Cost: {order.cost > 0 ? <><span className="flex items-center gap-1">{order.cost.toLocaleString()} <SatoshiIcon className="w-4 h-4" /></span></> : 'N/A'}</p>
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


export default function TreasuryPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
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
            <CardTitle>Enter Your Treasury</CardTitle>
            <CardDescription>Log in to manage your assets.</CardDescription>
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

  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
       <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3 font-headline">
          <Coins /> Your Treasury
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Manage your physical and intellectual assets.</p>
      </div>

      <div className="space-y-8">
        <AddAssetForm />
        <AssetList />
      </div>
    </main>
  );
}
