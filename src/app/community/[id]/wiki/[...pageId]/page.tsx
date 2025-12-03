
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
import Image from 'next/image';

type WikiPage = {
    id: string;
    title: string;
    content: string;
    lastModifiedAt: { seconds: number; nanoseconds: number; } | null;
    lastModifiedByUserId: string;
    lastModifiedByUserName: string;
};

type Community = {
    id: string;
    name: string;
    flagUrl?: string;
};

export default function CommunityWikiPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();

    const communityId = params.id as string;
    const pageIdParts = Array.isArray(params.pageId) ? params.pageId : [params.pageId];
    const pageId = pageIdParts.join('/');
    const isNewPage = pageId === 'new';

    const [isEditing, setIsEditing] = useState(isNewPage);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const basePath = `/community/${communityId}/wiki`;
    const collectionPath = `communities/${communityId}/wiki`;
    const finalPageId = isNewPage ? title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : pageId;

    const pageDocRef = useMemoFirebase(() => !isNewPage ? doc(firestore, collectionPath, pageId) : null, [collectionPath, pageId, isNewPage]);
    const [page, isLoading, error] = useDocumentData<WikiPage>(pageDocRef);

    const communityDocRef = useMemoFirebase(() => communityId ? doc(firestore, 'communities', communityId) : null, [communityId]);
    const [community, isCommunityLoading] = useDocumentData<Community>(communityDocRef);


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
    
    const pageTitle = isEditing ? (isNewPage ? 'Creating New Page' : `Editing: ${page?.title}`) : (page?.title || title);

    if (isLoading || isCommunityLoading) {
        return <div className="flex justify-center py-12"><LoaderCircle className="w-12 h-12 animate-spin text-primary" /></div>;
    }
    
    if (error) {
        return <Card className="m-4"><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>{error.message}</CardContent></Card>;
    }
    
    if (!page && !isNewPage) {
        return (
             <main className="container mx-auto max-w-4xl py-8">
                <Card className="m-4 text-center">
                    <CardHeader>
                        <CardTitle>Page Not Found</CardTitle>
                        <CardDescription>The requested wiki page does not exist in this community.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {user ? (
                            <Button asChild>
                                <Link href={`${basePath}/new`}>Create This Page</Link>
                            </Button>
                        ) : null}
                         <Button asChild variant="secondary">
                            <Link href={`/community/${communityId}`}>Back to Community</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="container mx-auto max-w-4xl py-8">
            <div className="mb-6 flex justify-between items-center">
                 <Button asChild variant="ghost">
                    <Link href={`/community/${communityId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Community
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
                     {community?.flagUrl && (
                        <div className="mb-4 h-40 relative rounded-lg overflow-hidden border">
                            <Image src={community.flagUrl} alt={`${community.name} flag`} layout="fill" objectFit="cover" />
                        </div>
                    )}
                    <div className="text-sm text-muted-foreground font-medium">
                        {community?.name || 'Community'} Wiki
                    </div>
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
                            onTitleChange={setTitle}
                            content={content}
                            onContentChange={setContent}
                            isNewPage={isNewPage}
                        />
                    ) : (
                        <div
                            className="prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked(page?.content || content || '') }}
                        />
                    )}
                </CardContent>
                {isEditing && (
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
                            {isSaving ? <LoaderCircle className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                            Save Page
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </main>
    );
}
