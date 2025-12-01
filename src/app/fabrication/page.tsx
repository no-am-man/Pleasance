// src/app/fabrication/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle, UploadCloud, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf', // PDF
  'model/stl',       // .stl
  'model/obj',       // .obj
  '.glb', '.gltf',   // glTF
];

const FabricationSchema = z.object({
  file: z
    .any()
    .refine((files) => files?.length == 1, 'File is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type) || ACCEPTED_FILE_TYPES.some(ext => files?.[0]?.name.endsWith(ext)),
      'Only .pdf, .stl, .obj, .glb, and .gltf files are accepted.'
    ),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional(),
});

export default function FabricationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FabricationSchema>>({
    resolver: zodResolver(FabricationSchema),
    defaultValues: {
      notes: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FabricationSchema>) {
    setIsLoading(true);

    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: 'Upload Successful!',
      description: `Your file "${data.file[0].name}" has been received.`,
    });
    
    console.log('Form data:', {
      fileName: data.file[0].name,
      fileType: data.file[0].type,
      fileSize: data.file[0].size,
      notes: data.notes,
    });

    form.reset();
    setIsLoading(false);
  }

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Fabrication Service</CardTitle>
          <CardDescription>Upload a PDF for print-on-demand books or a CAD file (.stl, .obj) for 3D printing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Upload</FormLabel>
                    <FormControl>
                        <div className="relative">
                           <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                           <Input 
                                type="file" 
                                className="pl-10"
                                accept={ACCEPTED_FILE_TYPES.join(',')}
                                onChange={(e) => field.onChange(e.target.files)}
                            />
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any specific requirements for printing, binding, or materials..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" /> Submit for Fabrication
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
