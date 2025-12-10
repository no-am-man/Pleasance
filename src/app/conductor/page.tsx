// src/app/conductor/page.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, LoaderCircle, LogIn, Info, Link as LinkIcon, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { conductSuperAgentAction } from '../actions';
import { marked } from 'marked';
import { type ContentPart } from 'genkit/generate';
import { useTranslation } from '@/hooks/use-translation';


type Message = {
    role: 'user' | 'model';
    content: ContentPart[];
    timestamp: any;
};

type AmbassadorData = {
    id: string;
    history: Message[];
};

function ToolCall({ part }: { part: ContentPart }) {
    if (part.type !== 'toolRequest') return null;

    return (
        <Card className="my-2 bg-muted/50 border-dashed border-primary/50">
            <CardHeader className="p-2">
                <p className="text-xs font-mono text-primary">[Tool Call: {part.toolRequest.name}]</p>
            </CardHeader>
            <CardContent className="p-2 pt-0">
                <pre className="text-xs bg-background p-2 rounded-md overflow-x-auto">
                    <code>{JSON.stringify(part.toolRequest.input, null, 2)}</code>
                </pre>
            </CardContent>
        </Card>
    );
}

function AmbassadorExplanation() {
    const { t } = useTranslation();
    const [echoUrl, setEchoUrl] = useState('');
    
    const handleEchoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!echoUrl.trim()) return;
        const prompt = `Echo this form into my current community: ${echoUrl}`;
        // This is a bit of a hack to inject the action into the main chat input.
        // A more robust solution might use a dedicated button in this component.
        const inputElement = document.querySelector('form input[placeholder^="Ask the Ambassador"]') as HTMLInputElement;
        const submitButton = inputElement?.nextElementSibling as HTMLButtonElement;
        
        if (inputElement) {
            inputElement.value = prompt;
            // We need to manually trigger the 'change' event for React's state to update.
            const event = new Event('input', { bubbles: true });
            inputElement.dispatchEvent(event);

            // A small delay to ensure the state updates before we "click"
            setTimeout(() => {
                submitButton?.click();
                setEchoUrl('');
            }, 100);
        }
    };

    return (
        <div className="mt-8 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info className="text-primary"/> {t('ambasedor_explanation_title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <p>{t('ambasedor_explanation_p1')}</p>
                    <p>{t('ambasedor_explanation_p2')}</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><code className="bg-muted px-1 py-0.5 rounded-sm">/roadmap next up</code> - {t('ambasedor_explanation_li1')}</li>
                        <li><code className="bg-muted px-1 py-0.5 rounded-sm">/bug Title: "Mobile view is broken" Desc: "The main page does not render correctly on mobile devices." P: high</code> - {t('ambasedor_explanation_li2')}</li>
                        <li><code className="bg-muted px-1 py-0.5 rounded-sm">/community "Pleasance"</code> - {t('ambasedor_explanation_li3')}</li>
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LinkIcon className="text-primary"/> Echo a Thought-Form</CardTitle>
                    <CardDescription>
                        This is the core mechanic for sharing ideas across the Federation. Find a message bubble in another community, get its URL, and paste it here to create an "echo" in your own community's feed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleEchoSubmit} className="flex gap-2">
                        <Input 
                            value={echoUrl} 
                            onChange={(e) => setEchoUrl(e.target.value)} 
                            placeholder="e.g., https://your-app/community/community-id"
                        />
                        <Button type="submit">Echo</Button>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Resources</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline">
                        <a href="https://github.com/no-am-man/Pleasance" target="_blank" rel="noopener noreferrer">
                            <Github className="mr-2 h-4 w-4" />
                            {t('navGithub')}
                        </a>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ConductorPage() {
    const { user, isUserLoading } = useUser();
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    const [ambassadorData, setAmbassadorData] = useState<AmbassadorData | null>(null);
    const [isLoadingAmbassador, setIsLoadingAmbassador] = useState(true);

    useEffect(() => {
        if (isUserLoading || !user || !firestore) {
            if (!isUserLoading) setIsLoadingAmbassador(false);
            return;
        }

        setIsLoadingAmbassador(true);
        const docRef = doc(firestore, 'ambasedor', user.uid);
        const unsubscribe: Unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setAmbassadorData(docSnap.data() as AmbassadorData);
            } else {
                setAmbassadorData({ id: user.uid, history: [] });
            }
            setIsLoadingAmbassador(false);
        }, (error) => {
            console.error("Failed to listen to ambassador history:", error);
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
            setIsLoadingAmbassador(false);
        });

        return () => unsubscribe();

    }, [user, isUserLoading]);

    const history = ambassadorData?.history || [];

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const currentInput = input;
        setInput('');
        setIsThinking(true);
        
        await conductSuperAgentAction({ userId: user.uid, prompt: currentInput });
        
        setIsThinking(false);
    };
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [history]);

    if (isUserLoading || isLoadingAmbassador) {
        return (
            <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
                <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
            </main>
        );
    }
    
    if (!user) {
        return (
            <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
                <Card className="w-full max-w-md text-center shadow-lg">
                    <CardHeader>
                        <CardTitle>{t('ambasedor_title')}</CardTitle>
                        <CardDescription>{t('ambasedor_login_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" /> {t('ambasedor_login_button')}
                        </Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="container mx-auto max-w-2xl py-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3" data-testid="main-heading">
                    <Bot /> {t('ambasedor_title')}
                </h1>
                <p className="text-lg text-muted-foreground mt-2">{t('ambasedor_subtitle')}</p>
            </div>

            <Card className="flex-grow flex flex-col shadow-lg min-h-[60vh]">
                <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {history.map((msg, index) => (
                            <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                {msg.role === 'model' && (
                                    <Avatar className="w-9 h-9 border-2 border-primary">
                                        <AvatarFallback><Bot /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn("rounded-lg px-4 py-2 max-w-[85%]", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                    {msg.content.map((part, partIndex) => {
                                        if (part.type === 'text') {
                                            return <div key={partIndex} className="prose dark:prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked(part.text) }} />;
                                        }
                                        if (part.type === 'toolRequest') {
                                            return <ToolCall key={partIndex} part={part} />;
                                        }
                                        return null;
                                    })}
                                </div>
                                {msg.role === 'user' && user && (
                                    <Avatar className="w-9 h-9">
                                        <AvatarImage src={user.photoURL || ''} />
                                        <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                         {isThinking && (
                            <div className="flex items-start gap-3 justify-start">
                                <Avatar className="w-9 h-9 border-2 border-primary">
                                    <AvatarFallback><Bot /></AvatarFallback>
                                </Avatar>
                                <div className="bg-muted rounded-lg px-4 py-2 flex items-center">
                                    <LoaderCircle className="w-5 h-5 animate-spin"/>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="border-t p-4">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder={t('ambasedor_input_placeholder')}
                            disabled={isThinking}
                        />
                        <Button type="submit" disabled={isThinking || !input.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </Card>

            <AmbassadorExplanation />
        </main>
    );
}
