
'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { marked } from 'marked';

interface WikiEditorProps {
    title: string;
    onTitleChange: (title: string) => void;
    content: string;
    onContentChange: (content: string) => void;
    isNewPage: boolean;
}

export function WikiEditor({ title, onTitleChange, content, onContentChange, isNewPage }: WikiEditorProps) {
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
                     <label htmlFor="wiki-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Markdown Content
                    </label>
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

    