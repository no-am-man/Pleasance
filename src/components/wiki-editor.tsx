
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { marked } from 'marked';
import { refineWikiPageAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface WikiEditorProps {
    title: string;
    onTitleChange: (title: string) => void;
    content: string;
    onContentChange: (content: string) => void;
    isNewPage: boolean;
}

export function WikiEditor({ title, onTitleChange, content, onContentChange, isNewPage }: WikiEditorProps) {
    const [isRefining, setIsRefining] = useState(false);
    const { toast } = useToast();

    const handleRefineContent = async () => {
        if (!title) {
            toast({
                variant: 'destructive',
                title: 'Title is required',
                description: 'Please enter a title before refining with AI.',
            });
            return;
        }
        setIsRefining(true);
        const result = await refineWikiPageAction({ title, content });
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'AI Refinement Failed',
                description: result.error,
            });
        } else if (result.refinedContent) {
            onContentChange(result.refinedContent);
            toast({
                title: 'Content Refined!',
                description: 'The AI has improved the page content.',
            });
        }
        setIsRefining(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="wiki-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Page Title
                </label>
                <Input
                    id="wiki-title"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="Enter page title"
                    disabled={!isNewPage && !title}
                />
                 {isNewPage && (
                    <p className="text-xs text-muted-foreground mt-1">
                        URL Path: /{title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
                    </p>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                     <div className="flex justify-between items-center mb-1">
                        <label htmlFor="wiki-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Markdown Content
                        </label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRefineContent}
                                        disabled={isRefining}
                                    >
                                        {isRefining ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4 text-primary" />}
                                        <span className="ml-2">Refine</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Improve content with AI</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Textarea
                        id="wiki-content"
                        value={content}
                        onChange={(e) => onContentChange(e.target.value)}
                        placeholder="Write your content here. Markdown is supported."
                        className="min-h-[400px] font-mono"
                    />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Live Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked(content) }}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
