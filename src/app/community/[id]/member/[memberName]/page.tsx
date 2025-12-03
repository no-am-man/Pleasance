// src/app/community/[id]/member/[memberName]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoaderCircle, AlertCircle, ArrowLeft, Bot, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { getAiChatResponse } from '@/app/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { type ChatHistory } from 'genkit';

type Member = {
  name: string;
  role: string;
  bio: string;
  type: 'AI' | 'human';
};

type Community = {
  id: string;
  name: string;
  description: string;
  welcomeMessage: string;
  ownerId: string;
  members: Member[];
};

type ChatMessage = {
    role: 'user' | 'model';
    text: string;
};

function ChatInterface({ member }: { member: Member }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const chatHistory: ChatHistory = messages.map(msg => ({
            role: msg.role,
            content: [{ text: msg.text }],
        }));

        const result = await getAiChatResponse({
            member,
            userMessage: input,
            history: chatHistory,
        });

        setIsLoading(false);
        
        if (result.error) {
            const errorMessage: ChatMessage = { role: 'model', text: `Sorry, I encountered an error: ${result.error}` };
            setMessages(prev => [...prev, errorMessage]);
        } else {
            const aiMessage: ChatMessage = { role: 'model', text: result.response! };
            setMessages(prev => [...prev, aiMessage]);
        }
    };

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <Card className="bg-background/50">
            <CardHeader>
                <CardTitle>Interact with {member.name}</CardTitle>
                <CardDescription>
                    Start a conversation with this AI community member.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72 w-full pr-4" ref={scrollAreaRef}>
                     <div className="space-y-4">
                        {messages.map((msg, index) => (
                             <div key={index} className={cn("flex items-end gap-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                {msg.role === 'model' && (
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={`https://i.pravatar.cc/150?u=${member.name}`} />
                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn("rounded-lg px-4 py-2 max-w-[80%]", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                                {msg.role === 'user' && user && (
                                     <div className="flex flex-col items-center">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={user.photoURL || ''} />
                                            <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                     </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${member.name}`} />
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="bg-muted rounded-lg px-4 py-2 flex items-center">
                                    <LoaderCircle className="w-4 h-4 animate-spin"/>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={`Message ${member.name}...`}
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function AiMemberProfilePage() {
  const params = useParams();
  const router = useRouter();

  const communityId = Array.isArray(params.id) ? params.id[0] : params.id;
  const memberName = Array.isArray(params.memberName) ? params.memberName[0] : params.memberName;

  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!communityId || !firestore) {
        setIsLoading(false);
        return;
    };
    
    const fetchCommunity = async () => {
        setIsLoading(true);
        try {
            const communityDocRef = doc(firestore, 'communities', communityId);
            const docSnap = await getDoc(communityDocRef);
            if (docSnap.exists()) {
                setCommunity({ id: docSnap.id, ...docSnap.data() } as Community);
            } else {
                setError(new Error('Community not found.'));
            }
        } catch(e) {
            setError(e as Error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchCommunity();
  }, [communityId]);

  const member = community?.members.find(
    (m) => m.name === decodeURIComponent(memberName)
  );

  if (isLoading) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4">Error Loading Community</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              There was a problem loading the community data to find this member.
            </p>
            <pre className="mb-4 text-left text-sm bg-muted p-2 rounded-md overflow-x-auto">
              <code>{error.message}</code>
            </pre>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!member) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle>Member Not Found</CardTitle>
            <CardDescription>This AI member does not exist in this community.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
                <Link href={`/community/${communityId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Community
                </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl py-8">
      <div className="mb-4">
        <Button asChild variant="ghost">
            <Link href={`/community/${communityId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to {community?.name}
            </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader className="text-center items-center">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${member.name}`} alt={member.name} />
            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{member.name}</CardTitle>
          <CardDescription className="text-lg text-primary font-medium">{member.role}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><Bot className="w-5 h-5"/> Bio</h3>
                <p className="text-lg bg-muted p-4 rounded-md">{member.bio}</p>
            </div>
            <ChatInterface member={member} />
        </CardContent>
      </Card>
    </main>
  );
}
