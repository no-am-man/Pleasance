// src/app/treasury/page.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, errorEmitter, FirestorePermissionError, getFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, getDocs, onSnapshot, Unsubscribe, updateDoc } from 'firebase/firestore';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addDocument } from '@/firebase/non-blocking-updates';
import type { Community } from '@/lib/types';


const AssetSchema = z.object({
  name: z.string().min(2, 'Asset name must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.').max(500, 'Description cannot exceed 500 characters.'),
  type: z.enum(['physical', 'virtual', 'ip'], { required_error: 'Please select an asset type.' }),
  value: z.coerce.number().min(0, 'Value must be a positive number.'),
  file: z.any().optional(),
  communityId: z.string().optional(), // 'private' or a community ID
});

type Asset = z.infer<typeof AssetSchema> & {
    id: string;
    ownerId: string;
    createdAt: { seconds: number; nanoseconds: number; } | null;
    fileUrl?: string;
    communityId?: string;
};

function AddAssetForm({ userCommunities, onAssetAdded }: { userCommunities: Community[], onAssetAdded: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    const form = useForm<z.infer<typeof AssetSchema>>({
        resolver: zodResolver(AssetSchema),
        defaultValues: { name: '', description: '', type: 'physical', value: 0, communityId: 'private' },
    });

    async function onSubmit(data: z.infer<typeof AssetSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: t('treasury_toast_not_authenticated'), description: t('treasury_toast_not_authenticated_desc') });
            return;
        }
        setIsLoading(true);

        const formData = new FormData();
        formData.append('userId', user.uid);
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('type', data.type);
        formData.append('value', String(data.value));
        if (data.communityId) {
            formData.append('communityId', data.communityId);
        }
        
        try {
            const result = await declareAssetWithFileAction(formData);
            if (result.error) {
              throw new Error(result.error);
            }

            toast({
                title: t('treasury_toast_asset_added_title'),
                description: t('treasury_toast_asset_added_desc', { name: data.name }),
            });
            form.reset();
            onAssetAdded(); // Callback to refresh the list
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: t('treasury_toast_add_failed_title'), description: message });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{t('treasury_add_asset_title')}</CardTitle>
                <CardDescription>{t('treasury_add_asset_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="communityId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Treasury</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a treasury to add this asset to" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="private">My Personal Treasury</SelectItem>
                                            {userCommunities.map(community => (
                                                <SelectItem key={community.id} value={community.id}>{community.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>Choose whether this is a private asset or belongs to a community.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('treasury_asset_name_label')}</FormLabel>
                                    <FormControl><Input placeholder={t('treasury_asset_name_placeholder')} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="value" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">{t('treasury_asset_value_label')}</FormLabel>
                                    <FormControl><div className="relative"><SatoshiIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" placeholder="10000" className="pl-8" {...field} /></div></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                         <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('treasury_asset_desc_label')}</FormLabel>
                                <FormControl><Textarea placeholder={t('treasury_asset_desc_placeholder')} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="type" render={({ field }) => (
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
                        )}/>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            {t('treasury_add_asset_button')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function AssetCard({ asset }: { asset: Asset }) {
    const isViewableVirtualAsset = (asset.type === 'virtual' || asset.type === 'ip') && asset.fileUrl && asset.fileUrl.endsWith('.json');
    const isFabricatable = !!asset.fileUrl;
    const { t } = useTranslation();

    return (
        <div className="flex flex-col sm:flex-row items-start gap-4 rounded-md border p-4">
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
}

export default function TreasuryPage() {
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();
  
  const [personalAssets, setPersonalAssets] = useState<Asset[]>([]);
  const [communityAssets, setCommunityAssets] = useState<Asset[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllData = useCallback(async () => {
    const { firestore } = getFirebase();
    if (!user || !firestore) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        // Fetch communities user is a member of
        const communitiesQuery = query(collection(firestore, 'communities'), where('members', 'array-contains', user.uid));
        const communitiesSnapshot = await getDocs(communitiesQuery);
        const communitiesData = communitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
        setUserCommunities(communitiesData);

        // Fetch personal assets
        const personalAssetsQuery = query(collection(firestore, `users/${user.uid}/assets`));
        const personalAssetsSnapshot = await getDocs(personalAssetsQuery);
        setPersonalAssets(personalAssetsSnapshot.docs.map(doc => doc.data() as Asset));
        
        // Fetch assets from all communities the user is in
        const communityAssetPromises = communitiesData.map(async (community) => {
            const assetsQuery = query(collection(firestore, `communities/${community.id}/assets`));
            const assetsSnapshot = await getDocs(assetsQuery);
            return assetsSnapshot.docs.map(doc => ({ ...doc.data(), communityId: community.id } as Asset));
        });
        
        const allCommunityAssets = (await Promise.all(communityAssetPromises)).flat();
        setCommunityAssets(allCommunityAssets);

    } catch (err: any) {
        setError(err);
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isUserLoading) {
      fetchAllData();
    }
  }, [isUserLoading, fetchAllData]);

  if (isUserLoading || isLoading) {
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
        <AddAssetForm userCommunities={userCommunities} onAssetAdded={fetchAllData} />
        
        {error && (
            <p className="text-destructive text-center">{t('treasury_error_loading_assets', { message: error.message })}</p>
        )}

        <Tabs defaultValue="personal">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Personal Assets</TabsTrigger>
                <TabsTrigger value="community">Community Assets</TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Personal Assets</CardTitle>
                        <CardDescription>Assets declared in your private treasury.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {personalAssets.length > 0 ? (
                            <div className="space-y-4">
                                {personalAssets.map(asset => <AssetCard key={asset.id} asset={asset} />)}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">{t('treasury_empty_title')}</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="community" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Community Assets</CardTitle>
                        <CardDescription>Assets belonging to the communities you are a part of.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {communityAssets.length > 0 ? (
                            <div className="space-y-4">
                                {communityAssets.map(asset => <AssetCard key={asset.id} asset={asset} />)}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">No assets found in your communities.</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
