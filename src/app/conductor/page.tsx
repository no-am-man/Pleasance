// src/app/conductor/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useMemoFirebase } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, LoaderCircle, LogIn, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { conductSuperAgent } from '../actions';
import { marked } from 'marked';
import { type ContentPart } from 'genkit/generate';


type Message = {
    role: 'user' | 'model';
    content: ContentPart[];
    timestamp: any;
};

type ConductorData = {
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

export default function ConductorPage() {
    const { user, isUserLoading } = useUser();
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const conductorDocRef = useMemoFirebase(() => user ? doc(firestore, 'conductor', user.uid) : null, [user]);
    
    const [conductorData, setConductorData] = useState<ConductorData | null>(null);
    const [isLoadingConductor, setIsLoadingConductor] = useState(true);

    useEffect(() => {
        if (!conductorDocRef) {
            setIsLoadingConductor(false);
            return;
        }
        const unsubscribe = onSnapshot(conductorDocRef, (doc) => {
            setConductorData(doc.exists() ? doc.data() as ConductorData : null);
            setIsLoadingConductor(false);
        });
        return () => unsubscribe();
    }, [conductorDocRef]);

    const history = conductorData?.history || [];

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user || !conductorDocRef) return;

        const userMessage: Message = {
            role: 'user',
            content: [{ text: input }],
            timestamp: new Date(),
        };

        // Optimistically update the UI with the user's message
        await setDoc(conductorDocRef, { history: [...history, userMessage] }, { merge: true });
        
        setInput('');
        setIsThinking(true);

        const result = await conductSuperAgent({ userId: user.uid, prompt: input });
        
        setIsThinking(false);

        if (result.error) {
            const errorMessage: Message = {
                role: 'model',
                content: [{ text: `I encountered an error: ${result.error}` }],
                timestamp: new Date(),
            };
             await setDoc(conductorDocRef, { history: [...history, userMessage, errorMessage] }, { merge: true });
        }
    };
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [history]);

    if (isUserLoading || isLoadingConductor) {
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
                        <CardTitle>Conductor SuperAgent</CardTitle>
                        <CardDescription>Log in to interact with the application's central AI.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" /> Login to Continue
                        </Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="container mx-auto max-w-2xl py-8 flex flex-col h-[calc(100vh-8rem)]">
            <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
                    <Bot /> Conductor SuperAgent
                </h1>
                <p className="text-lg text-muted-foreground mt-2">Your conversational interface to the application.</p>
            </div>

            <Card className="flex-grow flex flex-col shadow-lg">
                <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {history.map((msg, index) => (
                            <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                {msg.role === 'model' && (
                                    <Avatar className="w-9 h-9 border-2 border-primary">
                                        <AvatarFallback><Bot /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn("rounded-lg px-4 py-2 max-w-[85%] prose prose-sm dark:prose-invert prose-p:my-2", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
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
                            placeholder="Ask the Conductor... (e.g., 'What is being worked on right now?')"
                            disabled={isThinking}
                        />
                        <Button type="submit" disabled={isThinking || !input.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </main>
    );
}
