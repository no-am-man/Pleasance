
// src/app/conductor/page.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, LoaderCircle, LogIn, Info } from 'lucide-react';
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

type AmbasedorData = {
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

function AmbasedorExplanation() {
    const { t } = useTranslation();

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info className="text-primary"/> {t('ambasedor_explanation_title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
                <p>{t('ambasedor_explanation_p1')}</p>
                <p>{t('ambasedor_explanation_p2')}</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>{t('ambasedor_explanation_li1')}</li>
                    <li>{t('ambasedor_explanation_li2')}</li>
                    <li>{t('ambasedor_explanation_li3')}</li>
                </ul>
                <p>{t('ambasedor_explanation_p3')}</p>
            </CardContent>
        </Card>
    )
}

export default function AmbasedorPage() {
    const { user, isUserLoading } = useUser();
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    const [ambasedorData, setAmbasedorData] = useState<AmbasedorData | null>(null);
    const [isLoadingAmbasedor, setIsLoadingAmbasedor] = useState(true);

    useEffect(() => {
        if (!user || !firestore) {
            setIsLoadingAmbasedor(false);
            return;
        }

        setIsLoadingAmbasedor(true);
        const docRef = doc(firestore, 'ambasedor', user.uid);
        const unsubscribe: Unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setAmbasedorData(docSnap.data() as AmbasedorData);
            } else {
                setAmbasedorData({ id: user.uid, history: [] });
            }
            setIsLoadingAmbasedor(false);
        }, (error) => {
            console.error("Failed to listen to ambasedor history:", error);
            setIsLoadingAmbasedor(false);
        });

        return () => unsubscribe();

    }, [user]);

    const history = ambasedorData?.history || [];

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

    if (isUserLoading || isLoadingAmbasedor) {
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
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
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
                                            return <div key={partIndex} dangerouslySetInnerHTML={{ __html: marked(part.text) }} />;
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

            <AmbasedorExplanation />
        </main>
    );
}
