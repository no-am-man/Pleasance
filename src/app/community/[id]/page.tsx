
// src/app/community/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, ArrowLeft, Bot, User, PlusCircle, Send, Mic, Square, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getTranscription } from '@/app/actions';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

type VoiceMessage = {
    id: string;
    communityId: string;
    userId: string;
    userName: string;
    userAvatarUrl: string;
    audioUrl: string;
    transcription?: string;
    createdAt: { seconds: number, nanoseconds: number } | null;
};

function MemberCard({ member, index, communityId }: { member: Member; index: number; communityId: string;}) {
    const isHuman = member.type === 'human';
    const avatarUrl = `https://i.pravatar.cc/150?u=${member.name}-${index}`;
    
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
            <div className="flex-1">
                <CardTitle>{member.name}</CardTitle>
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

function RecordAudio({ communityId }: { communityId: string }) {
    const [isRecording, setIsRecording] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                setHasPermission(true);
            })
            .catch(err => {
                console.error("Mic permission denied:", err);
                setHasPermission(false);
            });
    }, []);

    const startRecording = async () => {
        if (!hasPermission) {
            toast({ variant: 'destructive', title: 'Microphone access denied.' });
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = async () => {
            setIsProcessing(true);
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                
                // For now, we will store the base64 audio directly.
                // In a real app, you'd upload this to Firebase Storage and get a URL.
                const audioUrl = base64Audio;
                
                // Get transcription
                const transcriptionResult = await getTranscription({ audioDataUri: base64Audio });

                if (transcriptionResult.error || !user || !firestore) {
                    toast({ variant: 'destructive', title: 'Transcription failed', description: transcriptionResult.error });
                    setIsProcessing(false);
                    return;
                }
                
                const messagesColRef = collection(firestore, `communities/${communityId}/messages`);
                const newMessage = {
                    communityId,
                    userId: user.uid,
                    userName: user.displayName || 'Anonymous',
                    userAvatarUrl: `https://i.pravatar.cc/150?u=${user.uid}`,
                    audioUrl,
                    transcription: transcriptionResult.transcription,
                    createdAt: serverTimestamp(),
                };

                await addDocumentNonBlocking(messagesColRef, newMessage);

                toast({ title: 'Message sent!' });
                audioChunksRef.current = [];
                setIsProcessing(false);
            };
        };
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
        <div className="flex flex-col items-center gap-4 p-4 border-t">
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

function RecordComment({ message }: { message: VoiceMessage }) {
    const [isRecording, setIsRecording] = useState(false);
    const { toast } = useToast();

    // Placeholder function for recording logic
    const toggleRecording = () => {
        setIsRecording(!isRecording);
        toast({
            title: isRecording ? 'Recording Stopped' : 'Recording Started',
            description: 'Comment recording coming soon!',
        });
    }

    return (
         <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-background">
            <Button onClick={toggleRecording} size="lg" className="rounded-full w-16 h-16 shadow-lg" disabled>
                {isRecording ? <Square /> : <Mic />}
            </Button>
            <p className="text-sm text-muted-foreground">{isRecording ? "Recording comment..." : "Record a voice comment"}</p>
        </div>
    )
}

function CommentDialog({ message }: { message: VoiceMessage }) {
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
            "{message.transcription}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="text-center text-muted-foreground text-sm">
                No replies yet. Be the first to comment.
            </div>
             <Separator />
            <div className="grid w-full gap-2">
                <RecordComment message={message} />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VoiceMessageCard({ message }: { message: VoiceMessage }) {
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
        <Card className="p-4 flex gap-4 items-start">
             <Avatar>
                <AvatarImage src={message.userAvatarUrl} alt={message.userName} />
                <AvatarFallback>{message.userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="font-bold">{message.userName}</span>
                    <span className="text-xs text-muted-foreground">
                        {message.createdAt
                            ? new Date(message.createdAt.seconds * 1000).toLocaleTimeString()
                            : "sending..."}
                    </span>
                </div>
                <audio ref={audioRef} src={message.audioUrl} className="hidden" />
                
                <div className="flex items-center gap-2">
                    <Button onClick={togglePlay} variant="outline" size="sm">
                        {isPlaying ? 'Pause' : 'Play Message'}
                    </Button>
                    <CommentDialog message={message} />
                </div>
                {message.transcription && (
                    <p className="text-sm text-muted-foreground pt-2 italic">"{message.transcription}"</p>
                )}
            </div>
        </Card>
    )
}

function VoiceChat({ communityId }: { communityId: string }) {
    const firestore = useFirestore();

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const messagesColRef = collection(firestore, `communities/${communityId}/messages`);
        return query(messagesColRef, orderBy('createdAt', 'desc'));
    }, [firestore, communityId]);

    const { data: messages, isLoading, error } = useCollection<VoiceMessage>(messagesQuery);

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Voice Chat</CardTitle>
                <CardDescription>Record and listen to voice messages from the community.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && <LoaderCircle className="mx-auto animate-spin" />}
                {error && <p className="text-destructive">Error loading messages.</p>}
                {messages && messages.length === 0 && <p className="text-muted-foreground text-center py-8">No messages yet. Be the first!</p>}
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                    {messages?.map(msg => <VoiceMessageCard key={msg.id} message={msg} />)}
                </div>
            </CardContent>
            <RecordAudio communityId={communityId} />
        </Card>
    )
}


export default function CommunityProfilePage() {
  const params = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
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

  const isOwner = user?.uid === community?.ownerId;
  const isMember = allMembers.some(m => m.userId === user?.uid);


  useEffect(() => {
    if (community) {
      let members: Member[] = [...(community.members || [])];
      if (ownerProfile) {
        const ownerMember: Member = {
          userId: ownerProfile.userId,
          name: ownerProfile.name,
          role: 'Founder',
          bio: ownerProfile.bio,
          type: 'human',
        };
        // Add the owner to the start of the list if not already present
        if (!members.some(m => m.userId === ownerMember.userId)) {
          members.unshift(ownerMember);
        }
      }
      setAllMembers(members);
    }
  }, [community, ownerProfile]);
  
  useEffect(() => {
    if (allProfiles && allMembers.length > 0) {
      const memberUserIds = new Set(allMembers.filter(m => m.userId).map(m => m.userId));
      const suggestions = allProfiles.filter(p => !memberUserIds.has(p.userId));
      setSuggestedUsers(suggestions);
    }
  }, [allProfiles, allMembers]);


  if (isLoading || profilesLoading) {
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

  return (
    <main className="container mx-auto min-h-screen max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <Button asChild variant="ghost">
            <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Communities
            </Link>
        </Button>
        {user && !isOwner && !isMember && (
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Request to Join
            </Button>
        )}
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
        <VoiceChat communityId={community.id} />
       </div>
      
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
                                    <Link href={`/profile/${profile.id}`} className="font-bold hover:underline">{profile.name}</Link>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
                                </div>
                                <Button variant="outline" size="sm" disabled>
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
