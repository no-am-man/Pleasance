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
import { generateSvg3d } from '@/app/actions';
import { GenerateSvg3dInputSchema, type ColorPixel } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Svg3dCube } from '@/components/icons/svg3d-cube';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { saveSvgAsset } from '../actions';
import Link from 'next/link';


const Svg3dSchema = GenerateSvg3dInputSchema;

const SaveAssetSchema = z.object({
    assetName: z.string().min(2, 'Asset name must be at least 2 characters.'),
    value: z.coerce.number().min(0, 'Value must be a positive number.'),
});

function SaveToTreasuryForm({ pixels, prompt }: { pixels: ColorPixel[], prompt: string }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof SaveAssetSchema>>({
        resolver: zodResolver(SaveAssetSchema),
        defaultValues: { assetName: prompt || '', value: 10 },
    });

    useEffect(() => {
        form.setValue('assetName', prompt);
    }, [prompt, form]);

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

    if (!user) return null;

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
                                    <FormLabel>Artwork Value (satoshis)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="10000" {...field} />
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

const objExample = `# 3D Point Cloud generated by Pleasance
v -20.0000 20.0000 10.0000 1.0000 0.3412 0.2000
v 15.0000 -10.0000 -15.0000 0.2000 1.0000 0.3412
v 5.0000 5.0000 25.0000 0.2000 0.3412 1.0000
`;

function AboutSvg3d() {
    return (
        <div className="mt-12 space-y-8">
            <h2 className="text-3xl font-bold text-center">About SVG3D</h2>
            <Card>
                <CardHeader>
                    <CardTitle>What is SVG3D?</CardTitle>
                    <CardDescription>From a prompt to a constellation of pixels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>In the context of our republic, "SVG3D" is the name we give to the generative art created in the Community Gallery. It's a <strong>3D point-cloud</strong>, a collection of colored points in a three-dimensional space, rendered within a Scalable Vector Graphic (SVG).</p>
                    <p>Think of it as a digital sculpture made of light. Each point has an X, Y, and Z coordinate, along with a color. When you provide a prompt to the AI, it doesn't just create a flat image; it imagines a 3D structure and represents it as this cloud of pixels. The interactive viewer then allows you to rotate and explore this structure in real-time.</p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>The Generation Process</CardTitle>
                    <CardDescription>How the AI translates your vision.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>When you submit a prompt in the gallery, you're providing the AI with a conceptual seed. The AI uses this seed to determine the shape, color palette, and arrangement of the pixels. The parameters you control have a direct impact:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Prompt:</strong> The most critical input. Concepts like "a lonely star" might produce a sparse, bright cloud, while "a dense nebula" would create a thick, colorful cluster.</li>
                        <li><strong>Cube Size:</strong> This defines the conceptual boundary of the 3D space. While all points are mapped to a -50 to 50 range internally, this parameter can influence the perceived scale in the AI's generation.</li>
                        <li><strong>Density:</strong> This controls the number of points in the cloud. Low density is sparse (~300-500 points), while High density is rich and detailed (~2000-3000 points).</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>The .obj File Format</CardTitle>
                    <CardDescription>The blueprint for physical creation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>When you download your creation, you receive a <code>.obj</code> file. This is a standard 3D geometry definition file format. For our point clouds, the format is simple. Each line starts with a 'v', followed by the X, Y, and Z coordinates, and then the R, G, and B values for the color (normalized from 0 to 1).</p>
                    <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto"><code>{objExample}</code></pre>
                    <p>This file is the digital blueprint that can be read by 3D fabrication software, bridging the gap between your virtual creation and a physical object.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>From Virtual to Physical</CardTitle>
                    <CardDescription>Manifesting your creation in the real world.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>The true power of this tool is realized when you manifest your creation. After saving your SVG3D artwork to your Treasury, you can submit it to the <strong>Workshop of Manifestation</strong>. The <code>.obj</code> file you generated is the key.</p>
                    <p>A network of artisans (like NNO.Studio for 3D printing) can use this file to create a physical representation of your digital sculpture. This is the final step in the journey from a simple idea to a tangible asset, a testament to the creative power of the republic.</p>
                     <div className="flex justify-center p-4">
                        <Button asChild>
                            <Link href="/fabrication">
                                <Warehouse className="mr-2 h-4 w-4" />
                                Go to the Workshop of Manifestation
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


export default function PersonalWorkshopPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixels, setPixels] = useState<ColorPixel[] | null>(null);
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { toast } = useToast();

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
      // The user doesn't need to be logged in to generate, so we pass dummy data for creator info.
      const result = await generateSvg3d({
          ...data,
          creatorId: 'public-user',
          creatorName: 'Anonymous',
          communityId: "personal-workshop",
      });

      if (result.error) {
        setError(result.error);
      } else if (result.success && result.creation) {
        setPixels(result.creation.pixels);
      }
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
          <Sparkles className="w-10 h-10" /> AI Workshop
        </h1>
        <p className="text-lg text-muted-foreground mt-2">A public sandbox to experiment with generative AI tools.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>Tool: 3D Point-Cloud Generator</CardTitle>
                <CardDescription>
                    Enter a prompt and watch the AI bring your idea to life in a rotatable 3D space.
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
      <AboutSvg3d />
    </main>
  );
}
