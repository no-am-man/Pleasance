
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
import { LoaderCircle, Sparkles, Save } from 'lucide-react';
import { generateSvg3d, saveSvgAsset } from '@/app/actions';
import { GenerateSvg3dInputSchema, type ColorPixel } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Svg3dCube } from '@/components/icons/svg3d-cube';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const Svg3dSchema = GenerateSvg3dInputSchema;

const SaveAssetSchema = z.object({
    assetName: z.string().min(2, 'Asset name must be at least 2 characters.'),
    value: z.coerce.number().min(0, 'Value must be a positive number.'),
});

function SaveToTreasuryForm({ pixels }: { pixels: ColorPixel[] }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof SaveAssetSchema>>({
        resolver: zodResolver(SaveAssetSchema),
        defaultValues: { assetName: '', value: 0 },
    });

    async function onSubmit(data: z.infer<typeof SaveAssetSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in to save an asset.' });
            return;
        }
        setIsSaving(true);
        try {
            const result = await saveSvgAsset({
                userId: user.uid,
                assetName: data.assetName,
                value: data.value,
                pixels: pixels,
            });

            if (result.error) {
                throw new Error(result.error);
            }
            toast({
                title: 'Asset Saved!',
                description: `"${data.assetName}" has been added to your Treasury.`,
            });
            form.reset();
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Failed to Save Asset', description: message });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card className="mt-4 bg-muted/50">
            <CardHeader>
                <CardTitle className="text-lg">Save to Treasury</CardTitle>
                <CardDescription>Declare this artwork as an intellectual property asset.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="assetName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Artwork Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 'Digital Sunrise'" {...field} />
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
                                    <FormLabel>Artwork Value (USD)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="100.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Asset
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}


export default function Svg3dPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixels, setPixels] = useState<ColorPixel[] | null>(null);
  const searchParams = useSearchParams();

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
          setError(`Failed to load asset: ${message}`);
        } finally {
          setIsLoading(false);
        }
      };
      loadAsset();
    }
  }, [searchParams]);

  async function onSubmit(data: z.infer<typeof Svg3dSchema>) {
    setIsLoading(true);
    setError(null);
    setPixels(null);

    try {
      const result = await generateSvg3d(data);

      if (result.error) {
        setError(result.error);
      } else if (result.pixels) {
        setPixels(result.pixels);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`Generation failed: ${message}`);
    }

    setIsLoading(false);
  }

  return (
    <main className="container mx-auto max-w-4xl py-8">
       <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <Svg3dCube pixels={[]} className="w-10 h-10" /> SVG3D Generator
        </h1>
        <p className="text-lg text-muted-foreground mt-2">An interactive 3D canvas for your imagination.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>Create Your Vision</CardTitle>
                <CardDescription>
                    Enter a prompt and watch the AI bring your idea to life in a rotatable 3D space. Go wild.
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
                            <FormLabel>Your Prompt</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., 'The birth of a star', 'Silent forest morning'" {...field} />
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
                                    <FormLabel>Cube Size (mm)</FormLabel>
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
                                    <FormLabel>Pixel Density</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select density" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
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
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Generating...
                        </>
                        ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" /> Generate
                        </>
                        )}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            
            {pixels && pixels.length > 0 && <SaveToTreasuryForm pixels={pixels} />}
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
                                    <AlertTitle>Generation Failed</AlertTitle>
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
                                <p>Your generated 3D art will appear here. <br/> Click and drag to rotate.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </main>
  );
}
