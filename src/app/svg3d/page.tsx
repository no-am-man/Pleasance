// src/app/svg3d/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { generateSvg3d } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Svg3dCube, type ColorPixel } from '@/components/icons/svg3d-cube';

const Svg3dSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters.'),
});

export default function Svg3dPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixels, setPixels] = useState<ColorPixel[] | null>(null);

  const form = useForm<z.infer<typeof Svg3dSchema>>({
    resolver: zodResolver(Svg3dSchema),
    defaultValues: {
      prompt: '',
    },
  });

  async function onSubmit(data: z.infer<typeof Svg3dSchema>) {
    setIsLoading(true);
    setError(null);
    setPixels(null);

    try {
      const result = await generateSvg3d({
        prompt: data.prompt,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.pixels) {
        setPixels(result.pixels);
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
          <Svg3dCube pixels={[]} className="w-10 h-10" /> SVG3D Generator
        </h1>
        <p className="text-lg text-muted-foreground mt-2">An interactive 3D canvas for your imagination.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
                        <Input placeholder="e.g., 'The birth of a star', 'Silent forest morning', 'Quantum entanglement'" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

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
