
// src/app/svg3d/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoaderCircle, Sparkles, Save, Download, Warehouse } from 'lucide-react';
import { generateSvg3dAction, saveSvgAssetAction } from '@/app/actions';
import { GenerateSvg3dInputSchema, type ColorPixel } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Svg3dCube } from '@/components/icons/svg3d-cube';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import Link from 'next/link';
import { SatoshiIcon } from '@/components/icons/satoshi-icon';
import { useTranslation } from '@/hooks/use-translation';


const Svg3dSchema = GenerateSvg3dInputSchema;

const SaveAssetSchema = z.object({
    assetName: z.string().min(2, 'Asset name must be at least 2 characters.'),
    value: z.coerce.number().min(0, 'Value must be a positive number.'),
});

function SaveToTreasuryForm({ pixels, prompt }: { pixels: ColorPixel[], prompt: string }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const { t } = useTranslation();

    const form = useForm<z.infer<typeof SaveAssetSchema>>({
        resolver: zodResolver(SaveAssetSchema),
        defaultValues: { assetName: prompt || '', value: 10 },
    });

    useEffect(() => {
        form.setValue('assetName', prompt);
    }, [prompt, form]);

    async function onSubmit(data: z.infer<typeof SaveAssetSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: t('workshop_login_to_save_toast') });
            return;
        }
        setIsSaving(true);
        try {
            const result = await saveSvgAssetAction({
                userId: user.uid,
                assetName: data.assetName,
                value: data.value,
                pixels: pixels,
            });

            if (result.error) {
                throw new Error(result.error);
            }
            toast({
                title: t('workshop_asset_saved_toast_title'),
                description: t('workshop_asset_saved_toast_desc', { name: data.assetName }),
            });
            form.reset();
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: t('workshop_asset_save_failed_toast'), description: message });
        } finally {
            setIsSaving(false);
        }
    }
    
     const handleDownloadObj = () => {
        const objData = convertPixelsToObj(pixels);
        const blob = new Blob([objData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'creation';
        a.download = `${fileName}.obj`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: 'Downloading .obj file...' });
    };

    if (!user) return null;

    return (
        <Card className="mt-4 bg-muted/50">
            <CardHeader>
                <CardTitle className="text-lg">{t('workshop_save_to_treasury_title')}</CardTitle>
                <CardDescription>{t('workshop_save_to_treasury_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Button onClick={handleDownloadObj} variant="secondary" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download .obj File for Fabrication
                    </Button>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 border-t">
                        <FormField
                            control={form.control}
                            name="assetName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('workshop_artwork_name_label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('workshop_artwork_name_placeholder')} {...field} />
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
                                    <FormLabel className="flex items-center gap-1.5">{t('workshop_artwork_value_label')}</FormLabel>
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
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {t('workshop_save_asset_button')}
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}

const objExample = `# 3D Point Cloud generated by Pleasance
v -20.0000 20.0000 10.0000 1.0000 0.3412 0.2000
v 15.0000 -10.0000 -15.0000 0.2000 1.0000 0.3412
v 5.0000 5.0000 25.0000 0.2000 0.3412 1.0000
`;

function AboutSvg3d() {
    const { t } = useTranslation();
    return (
        <div className="mt-12 space-y-8">
            <h2 className="text-3xl font-bold text-center">{t('workshop_about_title')}</h2>
            <Card>
                <CardHeader>
                    <CardTitle>{t('workshop_about_what_is_it_title')}</CardTitle>
                    <CardDescription>{t('workshop_about_what_is_it_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p dangerouslySetInnerHTML={{ __html: t('workshop_about_what_is_it_p1') }} />
                    <p>{t('workshop_about_what_is_it_p2')}</p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>{t('workshop_about_generation_title')}</CardTitle>
                    <CardDescription>{t('workshop_about_generation_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>{t('workshop_about_generation_p1')}</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li dangerouslySetInnerHTML={{ __html: t('workshop_about_generation_li_prompt') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('workshop_about_generation_li_cubesize') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('workshop_about_generation_li_density') }} />
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('workshop_about_obj_title')}</CardTitle>
                    <CardDescription>{t('workshop_about_obj_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>{t('workshop_about_obj_p1')}</p>
                    <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto"><code>{objExample}</code></pre>
                    <p>{t('workshop_about_obj_p2')}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>{t('workshop_about_physical_title')}</CardTitle>
                    <CardDescription>{t('workshop_about_physical_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p dangerouslySetInnerHTML={{ __html: t('workshop_about_physical_p1') }} />
                    <p>{t('workshop_about_physical_p2')}</p>
                     <div className="flex justify-center p-4">
                        <Button asChild>
                            <Link href="/fabrication">
                                <Warehouse className="mr-2 h-4 w-4" />
                                {t('workshop_about_physical_cta')}
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const convertPixelsToObj = (pixels: ColorPixel[]): string => {
    let objContent = '# 3D Point Cloud generated by the Pleasance Community Gallery\n';

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '1 1 1'; // Default to white if parse fails
        const r = parseInt(result[1], 16) / 255;
        const g = parseInt(result[2], 16) / 255;
        const b = parseInt(result[3], 16) / 255;
        return `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}`;
    };

    for (const pixel of pixels) {
        // OBJ format: v x y z r g b
        objContent += `v ${pixel.x.toFixed(4)} ${pixel.y.toFixed(4)} ${pixel.z.toFixed(4)} ${hexToRgb(pixel.color)}\n`;
    }

    return objContent;
};


export default function PersonalWorkshopPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixels, setPixels] = useState<ColorPixel[] | null>(null);
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof Svg3dSchema>>({
    resolver: zodResolver(Svg3dSchema),
    defaultValues: {
      prompt: '',
      cubeSize: 100,
      density: 'medium',
    },
  });
  
  useEffect(() => {
    const assetUrl = searchParams.get('assetUrl');
    if (assetUrl) {
      const loadAsset = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Use a proxy or server action if CORS becomes an issue. For now, direct fetch.
          const response = await fetch(assetUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch asset: ${response.statusText}`);
          }
          const data = await response.json();
          if (data.pixels) {
            setPixels(data.pixels);
          } else {
            throw new Error('Invalid asset data format.');
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : 'An unknown error occurred.';
          setError(t('workshop_failed_to_load_asset', { message }));
        } finally {
          setIsLoading(false);
        }
      };
      loadAsset();
    }
  }, [searchParams, t]);

  async function onSubmit(data: z.infer<typeof Svg3dSchema>) {
    setIsLoading(true);
    setError(null);
    setPixels(null);

    try {
      const result = await generateSvg3dAction(data);
        setPixels(result.pixels);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Generation failed: ${message}`);
    }

    setIsLoading(false);
  }

  return (
    <main className="container mx-auto max-w-4xl py-8">
       <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <Sparkles className="w-10 h-10" /> {t('workshop_title')}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{t('workshop_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>{t('workshop_tool_title')}</CardTitle>
                <CardDescription>
                    {t('workshop_tool_desc')}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('workshop_prompt_label')}</FormLabel>
                            <FormControl>
                            <Input placeholder={t('workshop_prompt_placeholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="cubeSize"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('workshop_cubesize_label')}</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="density"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('workshop_density_label')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select density" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="low">{t('workshop_density_low')}</SelectItem>
                                            <SelectItem value="medium">{t('workshop_density_medium')}</SelectItem>
                                            <SelectItem value="high">{t('workshop_density_high')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? (
                        <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> {t('workshop_generating_button')}
                        </>
                        ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" /> {t('workshop_generate_button')}
                        </>
                        )}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            
            {pixels && pixels.length > 0 && <SaveToTreasuryForm pixels={pixels} prompt={form.getValues('prompt')} />}
        </div>
        
        <div className="lg:sticky lg:top-24">
            <Card className="shadow-lg aspect-square">
                <CardContent className="p-2 h-full">
                     <div 
                        className="w-full h-full bg-muted rounded-md"
                    >
                         {isLoading && (
                            <div className="flex w-full h-full justify-center items-center p-8">
                                <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
                            </div>
                        )}

                        {error && (
                            <div className="flex w-full h-full justify-center items-center p-4">
                                <Alert variant="destructive">
                                    <AlertTitle>{t('workshop_generation_failed_toast_title')}</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            </div>
                        )}
                        
                        {pixels && (
                            <Svg3dCube pixels={pixels} />
                        )}

                        {!isLoading && !error && !pixels && (
                             <div className="flex w-full h-full flex-col gap-4 justify-center items-center text-center text-muted-foreground p-4">
                                <Svg3dCube pixels={[]} className="w-16 h-16" />
                                <p dangerouslySetInnerHTML={{ __html: t('workshop_placeholder_text')}} />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
      <AboutSvg3d />
    </main>
  );
}

    
