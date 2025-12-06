
// src/app/treasury/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, where, serverTimestamp, doc, getDocs, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { declareAssetWithFileAction } from '../actions';
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
import { useTranslation } from '@/hooks/use-translation';

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
    const { t } = useTranslation();

    const form = useForm<z.infer<typeof AssetSchema>>({
        resolver: zodResolver(AssetSchema),
        defaultValues: { name: '', description: '', type: 'physical', value: 0 },
    });

    async function onSubmit(data: z.infer<typeof AssetSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: t('treasury_toast_not_authenticated'), description: t('treasury_toast_not_authenticated_desc') });
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

            const result = await declareAssetWithFileAction(formData);

            if (result.error) {
                throw new Error(result.error);
            }

            toast({
                title: t('treasury_toast_asset_added_title'),
                description: t('treasury_toast_asset_added_desc', { name: data.name }),
            });
            form.reset();

        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: t('treasury_toast_add_failed_title'), description: message });
        } finally {
            setIsLoading(false);
        }
    }

    const fileRef = form.register("file");

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{t('treasury_add_asset_title')}</CardTitle>
                <CardDescription>{t('treasury_add_asset_desc')}</CardDescription>
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
                                        <FormLabel>{t('treasury_asset_name_label')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('treasury_asset_name_placeholder')} {...field} />
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
                                        <FormLabel className="flex items-center gap-1.5">{t('treasury_asset_value_label')}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <SatoshiIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" placeholder="10000" className="pl-8" {...field} />
                                            </div>
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
                                    <FormLabel>{t('treasury_asset_desc_label')}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t('treasury_asset_desc_placeholder')} {...field} />
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
                                    <FormLabel>{t('treasury_asset_type_label')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('treasury_asset_type_placeholder')} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        <SelectItem value="physical">{t('treasury_asset_type_physical')}</SelectItem>
                                        <SelectItem value="virtual">{t('treasury_asset_type_virtual')}</SelectItem>
                                        <SelectItem value="ip">{t('treasury_asset_type_ip')}</SelectItem>
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
                                        <FormLabel>{t('treasury_data_file_label')}</FormLabel>
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
                            {t('treasury_add_asset_button')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function AssetList() {
    const { user, isUserLoading } = useUser();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (isUserLoading || !user || !firestore) {
            if (!isUserLoading) setIsLoading(false);
            return;
        };

        const q = query(collection(firestore, 'users', user.uid, 'assets'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const assetsData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Asset));
            setAssets(assetsData);
            setIsLoading(false);
        }, (err) => {
            setError(err);
            setIsLoading(false);
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/assets`,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        });

        return () => unsubscribe();
    }, [user, isUserLoading]);

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoaderCircle className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <p className="text-destructive text-center">{t('treasury_error_loading_assets', { message: error.message })}</p>;
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{t('treasury_your_assets_title')}</CardTitle>
                <CardDescription>{t('treasury_your_assets_desc')}</CardDescription>
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
                                                    {t('treasury_view_button')}
                                                </Link>
                                            </Button>
                                        )}
                                        {isFabricatable && (
                                            <Button asChild variant="secondary" size="sm">
                                                <Link href={`/fabrication?assetId=${asset.id}`}>
                                                    <Warehouse className="mr-2 h-4 w-4" />
                                                    {t('treasury_fabricate_button')}
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
                        <p>{t('treasury_empty_title')}</p>
                        <p>{t('treasury_empty_desc')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function OrderList() {
    const { user, isUserLoading } = useUser();
    const [orders, setOrders] = useState<FabricationOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { t } = useTranslation();

     useEffect(() => {
        if (isUserLoading || !user || !firestore) {
            if (!isUserLoading) setIsLoading(false);
            return;
        }

        const ordersQuery = query(collection(firestore, 'fabricationOrders'), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FabricationOrder));
            setOrders(ordersData);
            setIsLoading(false);
        }, (err) => {
            setError(err);
            setIsLoading(false);
             const permissionError = new FirestorePermissionError({
                path: `fabricationOrders`,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        });

        return () => unsubscribe();
    }, [user, isUserLoading]);


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
        return <p className="text-destructive text-center">{t('treasury_error_loading_orders', { message: error.message })}</p>;
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{t('treasury_orders_title')}</CardTitle>
                <CardDescription>{t('treasury_orders_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                {orders && orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="flex items-center gap-4 rounded-md border p-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold">{order.assetName}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        {t('fabrication_supplier_cost_label', { 
                                            supplier: order.supplier, 
                                            cost: order.cost > 0 ? order.cost.toLocaleString() : t('fabrication_cost_na')
                                        })}
                                        {order.cost > 0 && <SatoshiIcon className="w-4 h-4" />}
                                    </p>
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
                        <p>{t('treasury_no_orders')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


export default function TreasuryPage() {
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();

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
            <CardTitle>{t('treasury_login_title')}</CardTitle>
            <CardDescription>{t('treasury_login_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> {t('treasury_login_button')}
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
          <Coins /> {t('treasury_page_title')}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{t('treasury_page_subtitle')}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('treasury_financial_system_desc')}</p>
      </div>

      <div className="space-y-8">
        <AddAssetForm />
        <AssetList />
      </div>
    </main>
  );
}
