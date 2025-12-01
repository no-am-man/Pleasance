
// src/app/community/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useStorage, setDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, addDoc, where, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, ArrowLeft, Bot, User, PlusCircle, Send, Mic, Square, MessageSquare, LogIn, Check, X, Hourglass, Volume2, CheckCircle, Circle, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getTranscription, updateMessageStatus } from '@/app/actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

type Member = {
  name: string;
  role: string;
  bio: string;
  type: 'AI' | 'human';
  avatarUrl?: string;
  userId?: string;
};

type Community = {
  id:string;
  name: string;
  description: string;
  welcomeMessage: string;
  ownerId: string;
  members: Member[];
};

type CommunityProfile = {
    id: string;
    userId: string;
    name: string;
    bio: string;
    nativeLanguage: string;
    learningLanguage: string;
};

type Message = {
    id: string;
    communityId: string;
    userId: string;
    userName: string;
    userAvatarUrl?: string;
    type: 'text' | 'voice';
    text?: string;
    audioUrl?: string;
    transcription?: string;
    createdAt: { seconds: number, nanoseconds: number } | null;
    status: 'active' | 'done';
};

type Comment = {
    id: string;
    userId: string;
    userName: string;
    userAvatarUrl?: string;
    type: 'text' | 'voice';
    text?: string;
    audioUrl?: string;
    transcription?: string;
    createdAt: { seconds: number, nanoseconds: number } | null;
}

type JoinRequest = {
    id: string;
    userId: string;
    userName: string;
    userBio: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: { seconds: number, nanoseconds: number } | null;
}

function MemberCard({ member, index, communityId }: { member: Member; index: number; communityId: string;}) {
    const isHuman = member.type === 'human';
    const avatarUrl = member.avatarUrl || `https://i.pravatar.cc/150?u=${member.name}-${index}`;
    
    const Wrapper = Link;
    
    let href = '#';
    if(isHuman && member.userId) {
        href = `/profile/${member.userId}`;
    } else if (!isHuman) {
        href = `/community/${communityId}/member/${encodeURIComponent(member.name)}`;
    }

    return (
      <Wrapper href={href}>
        <Card className={cn(
            "shadow-md transition-all h-full hover:shadow-lg hover:-translate-y-1 hover:bg-muted/50 cursor-pointer"
        )}>
            <CardHeader className="flex flex-row items-start gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarImage src={avatarUrl} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <CardTitle className="text-xl underline">{member.name}</CardTitle>
                <CardDescription className="text-primary font-medium">{member.role}</CardDescription>
            </div>
            {isHuman ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Human
                </Badge>
            ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    AI Member
                </Badge>
            )}
            </CardHeader>
            <CardContent>
            <p className="text-muted-foreground">{member.bio}</p>
            </CardContent>
        </Card>
      </Wrapper>
    );
}

function TextMessageForm({ communityId }: { communityId: string }) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const firestore = useFirestore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !user || !firestore) return;

        setIsSubmitting(true);
        
        const messagesColRef = collection(firestore, `communities/${communityId}/messages`);
        const newMessage = {
            communityId,
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userAvatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            type: 'text' as const,
            text: text.trim(),
            status: 'active' as const,
            createdAt: serverTimestamp(),
        };

        addDocumentNonBlocking(messagesColRef, newMessage);
        setText('');
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting || !text.trim()}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Send />}
            </Button>
        </form>
    );
}

function RecordAudio({ communityId }: { communityId: string }) {
    const [isRecording, setIsRecording] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const { user } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                setHasPermission(true);
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                recorder.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };
                recorder.onstop = async () => {
                    setIsProcessing(true);
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = async () => {
                        const base64Audio = reader.result as string;
                        if (!user || !firestore || !storage) return;

                        try {
                            const messagesColRef = collection(firestore, `communities/${communityId}/messages`);
                            const newMessageRef = doc(messagesColRef);

                            const audioPath = `communities/${communityId}/messages/${newMessageRef.id}.wav`;
                            const storageRef = ref(storage, audioPath);
                            const uploadResult = await uploadString(storageRef, base64Audio, 'data_url');
                            const audioUrl = await getDownloadURL(uploadResult.ref);
                            
                            const transcriptionResult = await getTranscription({ audioDataUri: base64Audio });
                             if (transcriptionResult.error) {
                                throw new Error(transcriptionResult.error);
                            }

                            const newMessage = {
                                communityId,
                                userId: user.uid,
                                userName: user.displayName || 'Anonymous',
                                userAvatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
                                type: 'voice',
                                audioUrl,
                                transcription: transcriptionResult.transcription,
                                createdAt: serverTimestamp(),
                                status: 'active',
                            };

                            await addDoc(messagesColRef, newMessage);

                            toast({ title: 'Message sent!' });
                        } catch (error) {
                             const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
                             toast({ variant: 'destructive', title: 'Failed to send message', description: message });
                        } finally {
                            audioChunksRef.current = [];
                            setIsProcessing(false);
                        }
                    };
                };
            })
            .catch(err => {
                console.error("Mic permission denied:", err);
                setHasPermission(false);
            });
    }, [user, firestore, storage, communityId, toast]);

    const startRecording = () => {
        if (!hasPermission || !mediaRecorderRef.current) {
            toast({ variant: 'destructive', title: 'Microphone access denied or not ready.' });
            return;
        }
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    if (hasPermission === null) {
        return <div className="flex items-center justify-center p-4"><LoaderCircle className="animate-spin"/></div>
    }
    
    if (hasPermission === false) {
        return (
             <Alert variant="destructive">
                <AlertTitle>Microphone Access Required</AlertTitle>
                <AlertDescription>Please enable microphone permissions in your browser settings to send voice messages.</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="flex flex-col items-center gap-4">
            {isProcessing ? (
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <LoaderCircle className="animate-spin" />
                    <span>Processing...</span>
                </div>
            ) : (
                <Button onClick={isRecording ? stopRecording : startRecording} size="lg" className="rounded-full w-16 h-16 shadow-lg">
                    {isRecording ? <Square /> : <Mic />}
                </Button>
            )}
           
            <p className="text-sm text-muted-foreground">{isRecording ? "Recording... Click to stop." : "Click to record a voice message."}</p>
        </div>
    );
}

function TextCommentForm({ communityId, messageId }: { communityId: string, messageId: string }) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !user || !firestore) return;

        setIsSubmitting(true);
        try {
            const commentsColRef = collection(firestore, `communities/${communityId}/messages/${messageId}/comments`);
            const newComment = {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userAvatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
                type: 'text',
                text: text.trim(),
                createdAt: serverTimestamp(),
            };
            await addDoc(commentsColRef, newComment);
            setText('');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
            toast({ variant: 'destructive', title: 'Failed to post comment', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a reply..."
                disabled={isSubmitting}
            />
            <Button type="submit" size="icon" disabled={isSubmitting || !text.trim()}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Send />}
            </Button>
        </form>
    );
}

function RecordComment({ communityId, messageId }: { communityId: string, messageId: string }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const { user } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            recorder.onstop = async () => {
                setIsProcessing(true);
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result as string;
                    if (!user || !firestore || !storage) return;

                    try {
                        const commentsColRef = collection(firestore, `communities/${communityId}/messages/${messageId}/comments`);
                        const newCommentRef = doc(commentsColRef);

                        const audioPath = `communities/${communityId}/messages/${messageId}/comments/${newCommentRef.id}.wav`;
                        const storageRef = ref(storage, audioPath);
                        const uploadResult = await uploadString(storageRef, base64Audio, 'data_url');
                        const audioUrl = await getDownloadURL(uploadResult.ref);

                        const transcriptionResult = await getTranscription({ audioDataUri: base64Audio });
                        if (transcriptionResult.error) {
                            throw new Error(transcriptionResult.error);
                        }

                        const newComment = {
                            id: newCommentRef.id,
                            userId: user.uid,
                            userName: user.displayName || 'Anonymous',
                            userAvatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
                            type: 'voice',
                            audioUrl,
                            transcription: transcriptionResult.transcription,
                            createdAt: serverTimestamp(),
                        };

                        await addDoc(commentsColRef, newComment);
                        toast({ title: 'Comment posted!' });
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
                        toast({ variant: 'destructive', title: 'Failed to post comment', description: message });
                    } finally {
                        audioChunksRef.current = [];
                        setIsProcessing(false);
                    }
                };
            };
            recorder.start();
            setIsRecording(true);
        } catch (err) {
            toast({ variant: 'destructive', title: 'Microphone access denied.' });
        }
    };

    if (isProcessing) {
        return (
            <div className="flex items-center justify-center gap-2 text-muted-foreground p-4">
                <LoaderCircle className="animate-spin" />
                <span>Processing...</span>
            </div>
        );
    }
    
    return (
         <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-background">
            <Button onClick={toggleRecording} size="lg" className="rounded-full w-16 h-16 shadow-lg">
                {isRecording ? <Square /> : <Mic />}
            </Button>
            <p className="text-sm text-muted-foreground">{isRecording ? "Recording comment..." : "Record a voice comment"}</p>
        </div>
    )
}


function CommentCard({ comment }: { comment: Comment }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };
    
    useEffect(() => {
        const audio = audioRef.current;
        if(audio) {
            const handleEnd = () => setIsPlaying(false);
            audio.addEventListener('ended', handleEnd);
            return () => audio.removeEventListener('ended', handleEnd);
        }
    }, [])

    return (
        <div className="p-3 rounded-md bg-muted/50 flex gap-3 items-start">
            <Avatar className="w-8 h-8">
                <AvatarImage src={comment.userAvatarUrl} alt={comment.userName} />
                <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1.5">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{comment.userName}</span>
                     <span className="text-xs text-muted-foreground">
                        {comment.createdAt
                            ? new Date(comment.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : "sending..."}
                    </span>
                </div>
                {comment.type === 'voice' ? (
                    <>
                        <audio ref={audioRef} src={comment.audioUrl} className="hidden" />
                        <Button onClick={togglePlay} variant="outline" size="sm">
                            {isPlaying ? 'Pause' : 'Play Comment'}
                        </Button>
                        {comment.transcription && (
                            <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">"{comment.transcription}"</p>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
                )}
            </div>
        </div>
    )
}

function CommentDialog({ message }: { message: Message }) {
    const firestore = useFirestore();

    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const commentsColRef = collection(firestore, `communities/${message.communityId}/messages/${message.id}/comments`);
        return query(commentsColRef, orderBy('createdAt', 'asc'));
    }, [firestore, message.communityId, message.id]);

    const { data: comments, isLoading } = useCollection<Comment>(commentsQuery);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Comment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Reply to {message.userName}'s message</DialogTitle>
                <DialogDescription>
                    {message.type === 'voice' ? `"${message.transcription}"` : message.text}
                </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                        {isLoading && <LoaderCircle className="mx-auto animate-spin" />}
                        {comments && comments.length > 0 ? (
                             comments.map(comment => <CommentCard key={comment.id} comment={comment} />)
                        ) : (
                            <div className="text-center text-muted-foreground text-sm py-4">
                                No replies yet. Be the first to comment.
                            </div>
                        )}
                       
                    </div>
                    <Separator />
                    <div className="grid w-full gap-4">
                        <TextCommentForm communityId={message.communityId} messageId={message.id} />
                        <div className="relative">
                            <Separator />
                            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-xs text-muted-foreground">OR</span>
                        </div>
                        <RecordComment communityId={message.communityId} messageId={message.id} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function MessageCard({ message, canManage }: { message: Message; canManage: boolean; }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    const isDone = message.status === 'done';

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if(audio) {
            const handleEnd = () => setIsPlaying(false);
            audio.addEventListener('ended', handleEnd);
            return () => audio.removeEventListener('ended', handleEnd);
        }
    }, [])

    const handleToggleStatus = async () => {
        setIsUpdating(true);
        const newStatus = isDone ? 'active' : 'done';
        const result = await updateMessageStatus({
            communityId: message.communityId,
            messageId: message.id,
            status: newStatus,
        });
        setIsUpdating(false);

        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: result.error,
            });
        } else {
            toast({
                title: `Message Marked as ${newStatus}`,
            });
        }
    };

    if (isDone) {
        return (
             <div className={cn("p-2 rounded-md flex items-center gap-3 transition-all", isUpdating && "opacity-50")}>
                <CheckCircle className="h-5 w-5 text-green-500" />
                 <Avatar className="w-8 h-8">
                    <AvatarImage src={message.userAvatarUrl} alt={message.userName} />
                    <AvatarFallback>{message.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <span className="font-semibold text-sm text-muted-foreground">{message.userName}'s message marked as done.</span>
                </div>
                {canManage && (
                    <Button variant="ghost" size="icon" onClick={handleToggleStatus} disabled={isUpdating}>
                         {isUpdating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                )}
            </div>
        )
    }

    return (
        <Card className={cn("flex flex-col", isUpdating && "opacity-50")}>
            <CardHeader className="flex flex-row items-start gap-4 pb-4">
                <Avatar>
                    <AvatarImage src={message.userAvatarUrl} alt={message.userName} />
                    <AvatarFallback>{message.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <span className="font-bold">{message.userName}</span>
                        <span className="text-xs text-muted-foreground">
                            {message.createdAt
                                ? new Date(message.createdAt.seconds * 1000).toLocaleTimeString()
                                : "sending..."}
                        </span>
                    </div>
                </div>
                 {canManage && (
                    <Button variant="ghost" size="icon" onClick={handleToggleStatus} disabled={isUpdating} aria-label="Mark as done">
                       {isUpdating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                {message.type === 'voice' ? (
                    <>
                        <audio ref={audioRef} src={message.audioUrl} className="hidden" />
                        {message.transcription && (
                            <p className="text-sm text-muted-foreground pt-2 italic whitespace-pre-wrap">"{message.transcription}"</p>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{message.text}</p>
                )}
            </CardContent>
            <CardFooter className="bg-muted/50 p-2">
                <div className="flex items-center gap-2">
                    {message.type === 'voice' && (
                        <Button onClick={togglePlay} variant="outline" size="sm">
                            <Volume2 className="mr-2 h-4 w-4" />
                            {isPlaying ? 'Pause' : 'Original'}
                        </Button>
                    )}
                    <CommentDialog message={message} />
                </div>
            </CardFooter>
        </Card>
    )
}

function Chat({ communityId, isOwner }: { communityId: string; isOwner: boolean }) {
    const { user } = useUser();
    const firestore = useFirestore();

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const messagesColRef = collection(firestore, `communities/${communityId}/messages`);
        return query(messagesColRef, orderBy('createdAt', 'desc'));
    }, [firestore, communityId]);

    const { data: messages, isLoading, error } = useCollection<Message>(messagesQuery);

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Community Chat</CardTitle>
                <CardDescription>Share messages with the community.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && <LoaderCircle className="mx-auto animate-spin" />}
                {error && <p className="text-destructive">Error loading messages.</p>}
                {messages && messages.length === 0 && <p className="text-muted-foreground text-center py-8">No messages yet. Be the first!</p>}
                <div className="max-h-[40rem] overflow-y-auto space-y-4 pr-2">
                    {messages?.map(msg => <MessageCard key={msg.id} message={msg} canManage={isOwner || msg.userId === user?.uid}/>)}
                </div>
            </CardContent>
            {user ? (
                <div className="border-t p-4 space-y-4">
                    <TextMessageForm communityId={communityId} />
                    <div className="relative">
                        <Separator />
                        <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-xs text-muted-foreground">OR</span>
                    </div>
                    <RecordAudio communityId={communityId} />
                </div>
            ) : (
                <div className="border-t p-4 text-center">
                    <Button asChild>
                        <Link href="/login">
                            <LogIn className="mr-2" />
                            Login to send a message
                        </Link>
                    </Button>
                </div>
            )}
        </Card>
    )
}

function JoinRequests({ communityId, communityDocRef }: { communityId: string, communityDocRef: any }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const requestsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const requestsColRef = collection(firestore, `communities/${communityId}/joinRequests`);
        return query(requestsColRef, where('status', '==', 'pending'));
    }, [firestore, communityId]);

    const { data: requests, isLoading } = useCollection<JoinRequest>(requestsQuery);

    const handleRequest = async (request: JoinRequest, newStatus: 'approved' | 'rejected') => {
        if (!firestore) return;
        const requestDocRef = doc(firestore, `communities/${communityId}/joinRequests`, request.id);
        
        try {
            if (newStatus === 'approved') {
                const newMember: Member = {
                    userId: request.userId,
                    name: request.userName,
                    bio: request.userBio,
                    role: 'Member',
                    type: 'human',
                };
                await updateDoc(communityDocRef, {
                    members: arrayUnion(newMember)
                });
            }
            await updateDoc(requestDocRef, { status: newStatus });
            toast({ title: `Request ${newStatus}.` });
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            toast({ variant: 'destructive', title: `Failed to ${newStatus} request`, description: message });
        }
    };

    if (isLoading) {
        return <LoaderCircle className="animate-spin mx-auto" />
    }
    
    if (!requests || requests.length === 0) {
        return <p className="text-muted-foreground text-center py-4">No pending join requests.</p>;
    }

    return (
        <div className="space-y-4">
            {requests.map(req => (
                <Card key={req.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${req.userId}`} alt={req.userName} />
                        <AvatarFallback>{req.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <Link href={`/profile/${req.userId}`} className="font-bold underline">{req.userName}</Link>
                        <p className="text-sm text-muted-foreground line-clamp-2">{req.userBio}</p>
                    </div>
                    <div className="flex gap-2 self-start sm:self-center">
                        <Button size="sm" onClick={() => handleRequest(req, 'approved')}><Check className="mr-2" />Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRequest(req, 'rejected')}><X className="mr-2" />Decline</Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}


export default function CommunityProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const communityDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'communities', id);
  }, [firestore, id]);

  const { data: community, isLoading, error } = useDoc<Community>(communityDocRef);
  
  const ownerProfileRef = useMemoFirebase(() => {
    if (!firestore || !community?.ownerId) return null;
    return doc(firestore, 'community-profiles', community.ownerId);
  }, [firestore, community?.ownerId]);

  const { data: ownerProfile } = useDoc<CommunityProfile>(ownerProfileRef);
  
  const allProfilesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'community-profiles');
  }, [firestore]);

  const { data: allProfiles, isLoading: profilesLoading } = useCollection<CommunityProfile>(allProfilesQuery);

  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<CommunityProfile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = user?.uid === community?.ownerId;
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'community-profiles', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<CommunityProfile>(userProfileRef);

  // Use a direct doc ref to check for a specific user's join request.
  const userJoinRequestRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    // Use the user's UID as the predictable document ID.
    return doc(firestore, 'communities', id, 'joinRequests', user.uid);
  }, [firestore, user, id]);
  
  // Use useDoc to fetch the specific request document.
  const { data: userJoinRequest, isLoading: isRequestLoading } = useDoc<JoinRequest>(userJoinRequestRef);

  // Determine if a pending request exists based on the useDoc result.
  const hasPendingRequest = userJoinRequest?.status === 'pending';

  useEffect(() => {
    if (community) {
      let members: Member[] = community.members ? [...community.members] : [];

      const ownerAsMember = members.find(m => m.userId === community.ownerId);

      if (ownerProfile) {
        const ownerMemberObject: Member = {
          userId: ownerProfile.userId,
          name: ownerProfile.name,
          role: 'Founder',
          bio: ownerProfile.bio,
          type: 'human',
        };

        if (ownerAsMember) {
          members = members.map(m => m.userId === community.ownerId ? ownerMemberObject : m);
        } else {
          members.unshift(ownerMemberObject);
        }
      }
      setAllMembers(members);
    }
  }, [community, ownerProfile]);
  
  const isMember = allMembers.some(m => m.userId === user?.uid);

  useEffect(() => {
    if (allProfiles && allMembers.length > 0) {
      const memberUserIds = new Set(allMembers.filter(m => m.userId).map(m => m.userId!));
      const suggestions = allProfiles.filter(p => !memberUserIds.has(p.userId));
      setSuggestedUsers(suggestions);
    }
  }, [allProfiles, allMembers]);

  const handleRequestToJoin = async () => {
    if (!user || !firestore || !id || !userProfile) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and have a profile to join.' });
        return;
    }
    setIsSubmitting(true);
    // Create a doc ref with the user's UID as the ID.
    const requestRef = doc(firestore, `communities/${id}/joinRequests`, user.uid);
    const newRequest: Omit<JoinRequest, 'createdAt' | 'id'> & { createdAt: any } = {
        userId: user.uid,
        userName: userProfile.name,
        userBio: userProfile.bio,
        status: 'pending',
        createdAt: serverTimestamp()
    };
    try {
        await setDocumentNonBlocking(requestRef, { ...newRequest, id: requestRef.id }, { merge: false });
        toast({ title: 'Request Sent!', description: 'The community owner has been notified.' });
    } catch(e) {
        const message = e instanceof Error ? e.message : 'An error occurred';
        toast({ variant: 'destructive', title: 'Failed to send request', description: message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleInvite = (profile: CommunityProfile) => {
    if (!communityDocRef) return;
    
    const newMember: Member = {
        userId: profile.userId,
        name: profile.name,
        bio: profile.bio,
        role: 'Member',
        type: 'human',
    };

    updateDocumentNonBlocking(communityDocRef, {
        members: arrayUnion(newMember)
    });

    toast({
        title: "Member Invited!",
        description: `${profile.name} has been added to the community.`
    })
  };


  if (isLoading || profilesLoading || isRequestLoading) {
    return (
      <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
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
            <CardTitle className="mt-4">An Error Occurred</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              There was a problem loading this community.
            </p>
            <pre className="mb-4 text-left text-sm bg-muted p-2 rounded-md overflow-x-auto">
              <code>{error.message}</code>
            </pre>
            <Button asChild variant="outline">
              <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Communities
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  if (!community) {
    return (
        <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
          <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <CardTitle>Community Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">We couldn't find the community you were looking for. It may have been deleted or the ID is incorrect.</p>
              <Button asChild variant="outline">
              <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Community Federation
              </Link>
            </Button>
            </CardContent>
          </Card>
        </main>
      );
  }

  const getJoinButton = () => {
    if (!user) {
        return <Button asChild><Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login to Join</Link></Button>
    }
    if (isOwner || isMember) return null;

    if (hasPendingRequest) {
        return <Button disabled><Hourglass className="mr-2 h-4 w-4 animate-spin" />Request Pending</Button>
    }

    return <Button onClick={handleRequestToJoin} disabled={isSubmitting}><PlusCircle className="mr-2 h-4 w-4" />Request to Join</Button>;
  }

  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <Button asChild variant="ghost">
            <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Communities
            </Link>
        </Button>
        {getJoinButton()}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
          {community.name}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{community.description}</p>
      </div>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Welcome Message</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{community.welcomeMessage}</p>
        </CardContent>
      </Card>
      
       <div className="my-12">
        <Chat communityId={community.id} isOwner={isOwner} />
       </div>
      
      {isOwner && (
         <>
            <Separator className="my-12" />
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Pending Join Requests</CardTitle>
                    <CardDescription>Approve or decline requests from users who want to join your community.</CardDescription>
                </CardHeader>
                <CardContent>
                    <JoinRequests communityId={id} communityDocRef={communityDocRef} />
                </CardContent>
            </Card>
        </>
      )}

      <Separator className="my-12" />

      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Meet the Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allMembers.map((member, index) => (
            <MemberCard key={`${member.name}-${index}`} member={member} index={index} communityId={community.id} />
          ))}
        </div>
      </div>
      
      {isOwner && (
        <>
            <Separator className="my-12" />
            <div>
                <h2 className="text-3xl font-bold text-center mb-8">Invite Members</h2>
                {suggestedUsers.length > 0 ? (
                    <div className="space-y-4">
                        {suggestedUsers.map(profile => (
                            <Card key={profile.id} className="flex items-center p-4">
                                <Avatar className="w-12 h-12 mr-4">
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${profile.name}`} alt={profile.name} />
                                    <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <Link href={`/profile/${profile.id}`} className="font-bold underline">{profile.name}</Link>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleInvite(profile)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Invite
                                </Button>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="flex items-center justify-center p-8">
                        <p className="text-muted-foreground">No new users to invite right now.</p>
                    </Card>
                )}
            </div>
        </>
      )}

    </main>
  );
}
