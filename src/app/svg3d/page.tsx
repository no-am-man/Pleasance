
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
import { generateSvg3dImage } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Svg3dCube } from '@/components/icons/svg3d-cube';

const Svg3dSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters.'),
});

export default function Svg3dPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  const form = useForm<z.infer<typeof Svg3dSchema>>({
    resolver: zodResolver(Svg3dSchema),
    defaultValues: {
      prompt: '',
    },
  });

  async function onSubmit(data: z.infer<typeof Svg3dSchema>) {
    setIsLoading(true);
    setError(null);
    setSvg(null);

    try {
      const result = await generateSvg3dImage({
        prompt: data.prompt,
        width: 500,
        height: 500,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.svg) {
        setSvg(result.svg);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Generation failed: ${message}`);
    }

    setIsLoading(false);
  }

  return (
    <main className="container mx-auto max-w-2xl py-8">
       <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
          <Svg3dCube className="w-10 h-10" /> SVG3D Generator
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Create sacred geometry based on a simple prompt.</p>
      </div>
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Generate an SVG3D Image</CardTitle>
          <CardDescription>
            Enter a prompt to inspire the AI. It will generate a unique vector image based on the SVG3D concept of a central cube with 8 expanding pyramids.
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

              <Button type="submit" disabled={isLoading}>
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
      
      {isLoading && (
        <div className="flex justify-center items-center p-8">
            <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {svg && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Generated SVG</CardTitle>
            </CardHeader>
            <CardContent>
                <div 
                    className="w-full h-auto aspect-square bg-muted rounded-md"
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            </CardContent>
        </Card>
      )}

    </main>
  );
}
