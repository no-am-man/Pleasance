
// src/app/community/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useStorage, setDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, where, updateDoc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, ArrowLeft, Bot, User, PlusCircle, Send, MessageSquare, LogIn, Check, X, Hourglass, CheckCircle, Circle, Undo2, Ban } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getAiChatResponse, updateMessageStatus, softDeleteMessage } from '@/app/actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { HumanIcon } from '@/components/icons/human-icon';
import { AiIcon } from '@/components/icons/ai-icon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
    avatarUrl?: string; // Add avatarUrl to profile type
};

type Message = {
    id: string;
    communityId: string;
    userId: string;
    userName: string;
    userAvatarUrl?: string;
    type: 'text';
    text?: string | null;
    createdAt: { seconds: number, nanoseconds: number } | null;
    status: 'active' | 'done';
    deleted?: boolean;
    deletedAt?: { seconds: number, nanoseconds: number } | null;
};

type Comment = {
    id: string;
    userId: string;
    userName: string;
    userAvatarUrl?: string;
    type: 'text';
    text?: string;
    createdAt: { seconds: number, nanoseconds: number } | null;
    deleted?: boolean;
    deletedAt?: { seconds: number, nanoseconds: number } | null;
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
                <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-background border-2 border-primary/20">
                    {isHuman ? (
                        <HumanIcon className="w-10 h-10 text-primary" />
                    ) : (
                        <AiIcon className="w-10 h-10 text-primary" />
                    )}
                </div>
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

function TextMessageForm({ communityId, onMessageSent }: { communityId: string, onMessageSent: (messageText: string) => void }) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const firestore = useFirestore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !user || !firestore) return;

        setIsSubmitting(true);
        
        const messagesColRef = collection(firestore, `communities/${communityId}/messages`);
        
        const newMessage = {
            communityId,
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userAvatarUrl: user.photoURL || undefined,
            type: 'text' as const,
            text: text.trim(),
            status: 'active' as const,
            createdAt: serverTimestamp(),
        };

        addDocumentNonBlocking(messagesColRef, newMessage);
        onMessageSent(text.trim());
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

function TextCommentForm({ communityId, messageId }: { communityId: string, messageId: string }) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const firestore = useFirestore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !user || !firestore) return;

        setIsSubmitting(true);
        const commentsColRef = collection(firestore, `communities/${communityId}/messages/${messageId}/comments`);
        const newComment = {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userAvatarUrl: user.photoURL || undefined,
            type: 'text' as const,
            text: text.trim(),
            createdAt: serverTimestamp(),
        };
        addDocumentNonBlocking(commentsColRef, newComment);
        setText('');
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a reply..."
                disabled={isSubmitting}
                className="h-9"
            />
            <Button type="submit" size="icon" variant="ghost" disabled={isSubmitting || !text.trim()}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
        </form>
    );
}

function CommentCard({ comment }: { comment: Comment }) {
    return (
        <div className="p-3 rounded-md bg-muted/50 flex gap-3 items-start">
            <Avatar className="w-8 h-8">
                <AvatarImage src={comment.userAvatarUrl || `https://i.pravatar.cc/150?u=${comment.userId}`} alt={comment.userName} />
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
                 <p className="text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
            </div>
        </div>
    )
}

function CommentThread({ message, comments, isLoading }: { message: Message, comments: Comment[] | null, isLoading: boolean }) {
    const { user } = useUser();

    return (
        <div className="pl-12 pr-4 pb-4 space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {isLoading && <LoaderCircle className="mx-auto animate-spin" />}
                {comments && comments.length > 0 && comments.map(comment => <CommentCard key={comment.id} comment={comment} />)}
            </div>
            {user && <TextCommentForm communityId={message.communityId} messageId={message.id} />}
        </div>
    );
}

function MessageCard({ message, canManage }: { message: Message; canManage: boolean; }) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const firestore = useFirestore();

    const isDone = message.status === 'done';
    const isDeleted = message.deleted;
    
    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const commentsColRef = collection(firestore, `communities/${message.communityId}/messages/${message.id}/comments`);
        return query(commentsColRef, orderBy('createdAt', 'asc'));
    }, [firestore, message.communityId, message.id]);

    const { data: comments, isLoading: isLoadingComments } = useCollection<Comment>(commentsQuery);
    const commentCount = comments?.length || 0;

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

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await softDeleteMessage({
            communityId: message.communityId,
            messageId: message.id,
        });
        setIsDeleting(false);

        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Delete Failed',
                description: result.error,
            });
        } else {
            toast({
                title: 'Message Deleted',
            });
        }
    };

     if (isDeleted) {
        return (
            <div className="p-4 rounded-md flex items-center gap-3 bg-muted/50">
                <Ban className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground italic">This message has been deleted.</span>
            </div>
        )
    }


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
        <Collapsible asChild>
            <Card className={cn("flex flex-col", (isUpdating || isDeleting) && "opacity-50")}>
                <div>
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
                        <div className="flex items-center">
                            {canManage && (
                                <>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={isDeleting} aria-label="Delete message">
                                                <Ban className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure you want to delete this message?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently hide the message content. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                                    {isDeleting ? <LoaderCircle className="animate-spin" /> : 'Delete'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button variant="ghost" size="icon" onClick={handleToggleStatus} disabled={isUpdating} aria-label="Mark as done">
                                        {isUpdating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                                    </Button>
                                </>
                            )}
                         </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{message.text}</p>
                    </CardContent>
                    <CardFooter className="bg-muted/50 p-2">
                        <div className="flex items-center gap-2">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="relative">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Comment
                                    {commentCount > 0 && (
                                        <Badge variant="secondary" className="ml-2">
                                            {commentCount}
                                        </Badge>
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </CardFooter>
                </div>
                <CollapsibleContent>
                   <CommentThread message={message} comments={comments} isLoading={isLoadingComments} />
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}

function Chat({ communityId, isOwner, allMembers }: { communityId: string; isOwner: boolean, allMembers: Member[] }) {
    const { user } = useUser();
    const firestore = useFirestore();

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const messagesColRef = collection(firestore, `communities/${communityId}/messages`);
        return query(messagesColRef, orderBy('createdAt', 'desc'));
    }, [firestore, communityId]);

    const { data: messages, isLoading, error } = useCollection<Message>(messagesQuery);
    
    const triggerAiResponse = async (userMessage: string) => {
        if (!firestore || !user) return;
        
        const aiMembers = allMembers.filter(m => m.type === 'AI');
        if (aiMembers.length === 0) return;
        
        // Select an AI member consistently to avoid hydration issues.
        const aiMemberToRespond = aiMembers[0];

        // Get chat history
        const chatHistory = (messages || [])
            .slice(0, 10) // Get last 10 messages for context
            .reverse() // Oldest first
            .map(msg => ({
                role: msg.userId === user?.uid ? 'user' : 'model' as 'user' | 'model',
                content: [{ text: msg.text || '' }],
            }));
            
        // Generate AI response
        const result = await getAiChatResponse({
            member: aiMemberToRespond,
            userMessage,
            history: chatHistory,
        });
        
        if (result.response) {
            const aiMessage = {
                communityId,
                userId: `ai_${aiMemberToRespond.name.toLowerCase().replace(/\s/g, '_')}`,
                userName: aiMemberToRespond.name,
                userAvatarUrl: `https://i.pravatar.cc/150?u=${aiMemberToRespond.name}`,
                type: 'text' as const,
                text: result.response,
                status: 'active' as const,
                createdAt: serverTimestamp(),
            };
            const messagesColRef = collection(firestore, `communities/${communityId}/messages`);
            addDocumentNonBlocking(messagesColRef, aiMessage);
        }
    };


    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Community Chat</CardTitle>
                <CardDescription>Share messages with the community.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && <LoaderCircle className="mx-auto animate-spin" />}
                {error && <p className="text-destructive">Error loading messages: {error.message}</p>}
                {messages && messages.length === 0 && <p className="text-muted-foreground text-center py-8">No messages yet. Be the first!</p>}
                <div className="max-h-[40rem] overflow-y-auto space-y-4 pr-2">
                    {messages?.map(msg => <MessageCard key={msg.id} message={msg} canManage={isOwner || msg.userId === user?.uid}/>)}
                </div>
            </CardContent>
            {user ? (
                <div className="border-t p-4 space-y-4">
                    <TextMessageForm communityId={communityId} onMessageSent={triggerAiResponse} />
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
                // Fetch the full profile of the user to get their avatar URL
                const profileRef = doc(firestore, 'community-profiles', request.userId);
                const profileSnap = await getDoc(profileRef);
                const profileData = profileSnap.exists() ? profileSnap.data() as CommunityProfile : null;

                const newMember: Member = {
                    userId: request.userId,
                    name: request.userName,
                    bio: request.userBio,
                    role: 'Member',
                    type: 'human',
                    avatarUrl: profileData?.avatarUrl || '', // Ensure avatarUrl is not undefined
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

  const userJoinRequestRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    return doc(firestore, 'communities', id, 'joinRequests', user.uid);
  }, [firestore, user, id]);
  
  const { data: userJoinRequest, isLoading: isRequestLoading } = useDoc<JoinRequest>(userJoinRequestRef);

  const hasPendingRequest = userJoinRequest?.status === 'pending';

  useEffect(() => {
    if (community && allProfiles) {
        const profilesMap = new Map(allProfiles.map(p => [p.userId, p]));
        
        const humanMembers = community.members
            .filter(m => m.type === 'human' && m.userId)
            .map(member => {
                const profile = profilesMap.get(member.userId!);
                return {
                    ...member,
                    name: profile?.name || member.name,
                    bio: profile?.bio || member.bio,
                    avatarUrl: profile?.avatarUrl || '', // Fallback to empty string
                };
            });

        const aiMembers = community.members.filter(m => m.type === 'AI');

        const ownerProfile = profilesMap.get(community.ownerId);
        // Ensure ownerProfile exists before trying to use it
        if (ownerProfile) {
            const ownerInList = humanMembers.find(m => m.userId === community.ownerId);
            if (!ownerInList) {
                humanMembers.unshift({
                    userId: ownerProfile.userId,
                    name: ownerProfile.name,
                    role: 'Founder',
                    bio: ownerProfile.bio,
                    type: 'human',
                    avatarUrl: ownerProfile.avatarUrl || '', // Fallback to empty string
                });
            }
        }
        
        setAllMembers([...humanMembers, ...aiMembers]);
    }
  }, [community, allProfiles]);
  
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
    const requestRef = doc(firestore, `communities/${id}/joinRequests`, user.uid);
    const newRequest: Omit<JoinRequest, 'id' | 'createdAt'> & { createdAt: any } = {
        userId: user.uid,
        userName: userProfile.name,
        userBio: userProfile.bio,
        status: 'pending',
        createdAt: serverTimestamp()
    };
    try {
        await setDoc(requestRef, { ...newRequest, id: requestRef.id });
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
        avatarUrl: profile.avatarUrl || '', // Ensure avatarUrl is not undefined
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
        <p className="text-lg text-accent-foreground mt-2">{community.description}</p>
      </div>

      <Card className="shadow-lg mb-8 border-2 border-primary">
        <CardHeader>
          <CardTitle>Welcome Message</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{community.welcomeMessage}</p>
        </CardContent>
      </Card>
      
       <div className="my-12">
        <Chat communityId={community.id} isOwner={isOwner} allMembers={allMembers} />
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
                                    <AvatarImage src={profile.avatarUrl || `https://i.pravatar.cc/150?u=${profile.name}`} alt={profile.name} />
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
    

    
