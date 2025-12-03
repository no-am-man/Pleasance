
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useMemoFirebase } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { marked } from 'marked';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Info, Edit, ArrowLeft, BookOpen, Save, Eye } from 'lucide-react';
import Link from 'next/link';
import { WikiEditor } from '@/components/wiki-editor';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

type WikiPage = {
    id: string;
    title: string;
    content: string;
    lastModifiedAt: { seconds: number; nanoseconds: number; } | null;
    lastModifiedByUserId: string;
    lastModifiedByUserName: string;
};

export default function WikiPageDisplay() {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();

    const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug];
    const isCommunityWiki = slugParts[0] === 'community';
    const communityId = isCommunityWiki ? slugParts[1] : null;
    const pageId = isCommunityWiki ? slugParts.slice(2).join('/') : slugParts.join('/');
    const isNewPage = pageId === 'new';

    const [isEditing, setIsEditing] = useState(isNewPage);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const basePath = isCommunityWiki ? `/wiki/community/${communityId}` : '/wiki';
    const collectionPath = isCommunityWiki ? `communities/${communityId}/wiki` : 'wiki';
    const finalPageId = isNewPage ? title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : pageId;

    const pageDocRef = useMemoFirebase(() => !isNewPage ? doc(firestore, collectionPath, pageId) : null, [collectionPath, pageId, isNewPage]);
    const [page, isLoading, error] = useDocumentData<WikiPage>(pageDocRef);

    useEffect(() => {
        if (page && !isEditing) {
            setTitle(page.title);
            setContent(page.content);
        }
    }, [page, isEditing]);
    
    useEffect(() => {
        if(isNewPage) {
            setTitle('');
            setContent('# New Page\n\nStart writing your content here.');
        }
    }, [isNewPage]);

    const handleSave = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in to save.' });
            return;
        }
        if (!title.trim()) {
            toast({ variant: 'destructive', title: 'Title is required.' });
            return;
        }

        setIsSaving(true);
        const docRef = doc(firestore, collectionPath, finalPageId);
        
        const pageData = {
            id: finalPageId,
            title,
            content,
            lastModifiedByUserId: user.uid,
            lastModifiedByUserName: user.displayName || 'Anonymous',
            lastModifiedAt: serverTimestamp(),
        };

        await setDocumentNonBlocking(docRef, pageData, { merge: true });
        
        toast({ title: 'Page Saved' });
        setIsSaving(false);
        setIsEditing(false);

        if (isNewPage) {
            router.push(`${basePath}/${finalPageId}`);
        }
    };
    
    const pageTitle = isEditing ? (isNewPage ? 'Creating New Page' : `Editing: ${page?.title}`) : page?.title;
    const breadcrumbPath = isCommunityWiki ? `/community/${communityId}` : '/wiki';
    const breadcrumbLabel = isCommunityWiki ? 'Community Wiki' : 'Public Wiki';

    if (isLoading) {
        return <div className="flex justify-center py-12"><LoaderCircle className="w-12 h-12 animate-spin text-primary" /></div>;
    }
    
    if (error) {
        return <Card className="m-4"><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>{error.message}</CardContent></Card>;
    }
    
    if (!page && !isNewPage) {
        return (
            <Card className="m-4 text-center">
                <CardHeader>
                    <CardTitle>Page Not Found</CardTitle>
                    <CardDescription>The requested wiki page does not exist.</CardDescription>
                </CardHeader>
                <CardContent>
                    {user ? (
                         <Button asChild>
                            <Link href={`${basePath}/new`}>Create This Page</Link>
                        </Button>
                    ) : (
                         <Button asChild variant="secondary">
                            <Link href={basePath}>Back to Wiki</Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <main className="container mx-auto max-w-4xl py-8">
            <div className="mb-6 flex justify-between items-center">
                 <Button asChild variant="ghost">
                    <Link href={breadcrumbPath}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to {breadcrumbLabel}
                    </Link>
                </Button>
                {user && !isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Page
                    </Button>
                )}
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl flex items-center gap-3">
                        <BookOpen className="text-primary" />
                        {pageTitle}
                    </CardTitle>
                    {page && !isEditing && (
                         <CardDescription>
                            Last updated {page.lastModifiedAt ? formatDistanceToNow(new Date(page.lastModifiedAt.seconds * 1000), { addSuffix: true }) : 'a while ago'} by {page.lastModifiedByUserName}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <WikiEditor
                            title={title}
                            content={content}
                            onTitleChange={setTitle}
                            onContentChange={setContent}
                            isNewPage={isNewPage}
                        />
                    ) : (
                        <div
                            className="prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked(content || page?.content || '') }}
                        />
                    )}
                </CardContent>
                {isEditing && (
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <LoaderCircle className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                            Save Page
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </main>
    );
}

    