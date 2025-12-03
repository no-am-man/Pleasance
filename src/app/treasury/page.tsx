// src/app/treasury/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, serverTimestamp, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle, LogIn, Coins, BrainCircuit, Box, PlusCircle, Eye, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { useCollectionData } from 'react-firebase-hooks/firestore';

const AssetSchema = z.object({
  name: z.string().min(2, 'Asset name must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.').max(500, 'Description cannot exceed 500 characters.'),
  type: z.enum(['physical', 'virtual', 'ip'], { required_error: 'Please select an asset type.' }),
  value: z.coerce.number().min(0, 'Value must be a positive number.'),
});

type Asset = z.infer<typeof AssetSchema> & {
    id: string;
    ownerId: string;
    createdAt: { seconds: number; nanoseconds: number; } | null;
    fileUrl?: string;
};

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
            const assetsCollectionRef = collection(firestore, 'users', user.uid, 'assets');
            const newAssetRef = doc(assetsCollectionRef);

            const newAsset = {
                ...data,
                id: newAssetRef.id,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            };
            
            // Non-blocking write
            setDocumentNonBlocking(newAssetRef, newAsset, { merge: false });

            toast({
                title: 'Asset Declared!',
                description: `${data.name} has been added to your treasury.`,
            });
            form.reset();

        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Failed to add asset', description: message });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Declare a New Asset</CardTitle>
                <CardDescription>Add a physical or intellectual property asset to your personal treasury.</CardDescription>
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
                                            <Input placeholder="e.g., Custom 3D Printed Drone Frame" {...field} />
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
                                        <FormLabel>Asset Value (USD)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="100.00" {...field} />
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
    const assetsQuery = useMemo(() => user ? query(collection(firestore, 'users', user.uid, 'assets')) : null, [user]);
    const [assets, isLoading, error] = useCollectionData<Asset>(assetsQuery, {
      idField: 'id'
    });

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoaderCircle className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <p className="text-destructive text-center">Error loading assets: {error.message}</p>;
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
                <CardDescription>A list of your declared sovereign assets.</CardDescription>
            </CardHeader>
            <CardContent>
                {assets && assets.length > 0 ? (
                    <div className="space-y-4">
                        {assets.map(asset => {
                            const isViewableVirtualAsset = (asset.type === 'virtual' || asset.type === 'ip') && asset.fileUrl;
                             const isFabricatable = !!asset.fileUrl;
                            return (
                                <div key={asset.id} className="flex flex-col sm:flex-row items-start gap-4 rounded-md border p-4">
                                    {asset.type === 'physical' ? <Box className="h-8 w-8 text-primary mt-1 flex-shrink-0" /> : <BrainCircuit className="h-8 w-8 text-primary mt-1 flex-shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold">{asset.name}</h3>
                                            <p className="font-mono text-primary font-bold text-lg whitespace-nowrap pl-4">${asset.value.toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{asset.description}</p>
                                    </div>
                                    <div className="flex gap-2 self-start sm:self-center flex-shrink-0">
                                        {isViewableVirtualAsset && (
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/workshop?assetUrl=${encodeURIComponent(asset.fileUrl!)}`}>
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
            <CardTitle>Access Your Treasury</CardTitle>
            <CardDescription>Log in to manage your personal assets.</CardDescription>
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
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <Coins /> Your Treasury
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Manage your sovereign physical and intellectual assets.</p>
      </div>

      <div className="space-y-8">
        <AddAssetForm />
        <AssetList />
      </div>
    </main>
  );
}
