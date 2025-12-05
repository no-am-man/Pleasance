
// src/app/community/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { firestore } from '@/firebase/config';
import { doc, collection, query, orderBy, serverTimestamp, where, arrayUnion, arrayRemove, updateDoc, getDoc, getDocs, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, ArrowLeft, Bot, User, PlusCircle, Send, MessageSquare, LogIn, Check, X, Hourglass, CheckCircle, Circle, Undo2, Ban, RefreshCw, Flag, Save, Download, Sparkles, Presentation, KanbanIcon, Info, LogOut, Wrench, Banknote, UserX } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { HumanIcon } from '@/components/icons/human-icon';
import { AiIcon } from '@/components/icons/ai-icon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Image from 'next/image';
import { generateCommunityFlagAction, welcomeNewMemberAction, notifyOwnerOfJoinRequestAction } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { addDocument } from '@/firebase/non-blocking-updates';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PresentationHall } from '@/components/community/PresentationHall';
import { JoinRequests } from '@/components/community/JoinRequests';
import { MemberCard } from '@/components/community/MemberCard';
import { useTranslation } from '@/hooks/use-translation';
import { useDynamicTranslation } from '@/hooks/use-dynamic-translation';

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
  flagUrl?: string;
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
    audience?: 'public' | 'owner';
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

type ColorPixel = {
    x: number;
    y: number;
    z: number;
    color: string;
};

function TextMessageForm({ communityId, onMessageSent }: { communityId: string, onMessageSent: () => void }) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
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
            audience: 'public' as const,
        };

        try {
            await addDocument(messagesColRef, newMessage);
            setText('');
            onMessageSent(); // This is now less critical but good for immediate feedback if needed elsewhere
        } catch (error) {
            const message = error instanceof Error ? error.message : t('community_page_unexpected_error');
            toast({ variant: 'destructive', title: t('community_page_send_message_fail_title'), description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('community_page_message_placeholder')}
                disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting || !text.trim()}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Send />}
            </Button>
        </form>
    );
}

function TextCommentForm({ communityId, messageId, onCommentSent }: { communityId: string, messageId: string, onCommentSent: () => void; }) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !user || !messageId || !communityId || !firestore) return;

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
        try {
            await addDocument(commentsColRef, newComment);
            setText('');
            onCommentSent();
        } catch(error) {
            const message = error instanceof Error ? error.message : t('community_page_unexpected_error');
            toast({ variant: 'destructive', title: t('community_page_send_reply_fail_title'), description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('community_page_reply_placeholder')}
                disabled={isSubmitting}
                className="h-9"
            />
            <Button type="submit" size="icon" variant="ghost" disabled={isSubmitting || !text.trim()}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
        </form>
    );
}

function CommentCard({ comment, communityId, messageId, canManage }: { comment: Comment; communityId: string; messageId: string, canManage: boolean; }) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isSoftDeleted, setIsSoftDeleted] = useState(comment.deleted);
    const { t } = useTranslation();

    const handleDelete = () => {
        if(!comment.id || !communityId || !messageId || !firestore) return;
        
        setIsUpdating(true); // Provide immediate feedback
        setIsSoftDeleted(true);

        const commentDocRef = doc(firestore, `communities/${communityId}/messages/${messageId}/comments`, comment.id);
        const updatePayload = {
            deleted: true,
            deletedAt: serverTimestamp(),
            text: '',
        };

        // Use non-blocking update
        updateDocumentNonBlocking(commentDocRef, updatePayload);
        
        toast({ title: t('community_page_comment_deleted_toast_title') });
        
        // No need to set isUpdating back to false unless you want to allow "undo"
    };

    if (isSoftDeleted) {
        return (
            <div className="p-3 rounded-md bg-muted/50 flex gap-3 items-start">
                <Ban className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground italic">{t('community_page_comment_deleted_text')}</span>
            </div>
        )
    }

    return (
        <div className="p-3 rounded-md bg-muted/50 flex gap-3 items-start group">
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
                            : t('community_page_sending_text')}
                    </span>
                </div>
                 <p className="text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
            </div>
            {canManage && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isUpdating || !comment.id} aria-label={t('community_page_delete_comment_label')}>
                            <Ban className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('community_page_delete_comment_dialog_title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('community_page_delete_comment_dialog_desc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('community_page_delete_cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                {isUpdating ? <LoaderCircle className="animate-spin" /> : t('community_page_delete_confirm')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    )
}

function CommentThread({ message, canManage }: { message: Message; canManage: boolean; }) {
    const { user } = useUser();
    const params = useParams();
    const communityId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(true);

    const fetchComments = useCallback(() => {
        if (!firestore || !message.communityId || !message.id) {
            setIsLoadingComments(false);
            return () => {};
        }

        setIsLoadingComments(true);
        const commentsQuery = query(collection(firestore, `communities/${message.communityId}/messages/${message.id}/comments`), orderBy('createdAt', 'asc'));
        
        const unsubscribe = onSnapshot(commentsQuery, (querySnapshot) => {
            const commentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(commentsData);
            setIsLoadingComments(false);
        }, (error) => {
            console.error("Error fetching comments:", error);
            setIsLoadingComments(false);
        });

        return unsubscribe;
    }, [message.communityId, message.id]);
    
    useEffect(() => {
        const unsubscribe = fetchComments();
        return () => unsubscribe();
    }, [fetchComments]);

    return (
        <div className="pl-12 pr-4 pb-4 space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {isLoadingComments && <LoaderCircle className="mx-auto animate-spin" />}
                {comments && comments.length > 0 && comments.map(comment => <CommentCard key={comment.id} comment={comment} communityId={communityId} messageId={message.id} canManage={canManage || user?.uid === message.userId} />)}
            </div>
            {user && <TextCommentForm communityId={message.communityId} messageId={message.id} onCommentSent={() => {}} />}
        </div>
    );
}

function MessageCard({ message, canManage }: { message: Message; canManage: boolean; }) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(true);
    const [isSoftDeleted, setIsSoftDeleted] = useState(message.deleted);
    const { t } = useTranslation();

    const isDone = message.status === 'done';
    const isReady = !!message.id && !!message.communityId && !!firestore;
    
    const handleToggleStatus = async () => {
        if (!isReady || !firestore) return;
        setIsUpdating(true);
        const newStatus = isDone ? 'active' : 'done';
        const messageDocRef = doc(firestore, 'communities', message.communityId, 'messages', message.id);
        
        await updateDoc(messageDocRef, { status: newStatus });
        
        toast({ title: t('community_page_message_status_toast', { status: newStatus }) });
        if (newStatus === 'done') {
            setIsCollapsibleOpen(false);
        }
        setIsUpdating(false);
    };

    const handleDelete = () => {
        if (!isReady || !firestore) return;
        
        setIsUpdating(true);
        setIsSoftDeleted(true);

        const messageDocRef = doc(firestore, `communities/${message.communityId}/messages`, message.id);
        const updatePayload = {
            deleted: true,
            deletedAt: serverTimestamp(),
            text: '', 
        };

        updateDocumentNonBlocking(messageDocRef, updatePayload);
        
        toast({ title: t('community_page_message_deleted_toast') });
    };

     if (isSoftDeleted) {
        return (
            <div className="p-4 rounded-md flex items-center gap-3 bg-muted/50">
                <Ban className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground italic">{t('community_page_message_deleted_text')}</span>
            </div>
        )
    }


    if (isDone) {
        return (
             <div className={cn("p-2 rounded-md flex items-center gap-3 transition-all", isUpdating && "opacity-50")}>
                <CheckCircle className="h-5 w-5 text-green-500" />
                 <Avatar className="w-8 h-8">
                    <AvatarImage src={message.userAvatarUrl || `https://i.pravatar.cc/150?u=${message.userId}`} alt={message.userName} />
                    <AvatarFallback>{message.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <span className="font-semibold text-sm text-muted-foreground">{t('community_page_message_done_text', { name: message.userName })}</span>
                </div>
                {canManage && (
                    <Button variant="ghost" size="icon" onClick={handleToggleStatus} disabled={isUpdating || !isReady}>
                         {isUpdating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                )}
            </div>
        )
    }

    return (
        <Collapsible open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen}>
            <Card className={cn("flex flex-col", isUpdating && "opacity-50", message.audience === 'owner' && 'bg-primary/10 border-primary')}>
                <div>
                    <CardHeader className="flex flex-row items-start gap-4 pb-4">
                        <Avatar>
                            <AvatarImage src={message.userAvatarUrl || `https://i.pravatar.cc/150?u=${message.userId}`} alt={message.userName} />
                            <AvatarFallback>{message.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="font-bold">{message.userName}</span>
                                <span className="text-xs text-muted-foreground">
                                    {message.createdAt
                                        ? new Date(message.createdAt.seconds * 1000).toLocaleTimeString()
                                        : t('community_page_sending_text')}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            {canManage && (
                                <>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={isUpdating || !isReady} aria-label={t('community_page_delete_message_label')}>
                                                <Ban className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('community_page_delete_message_dialog_title')}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('community_page_delete_message_dialog_desc')}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('community_page_delete_cancel')}</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                                    {isUpdating ? <LoaderCircle className="animate-spin" /> : t('community_page_delete_confirm')}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button variant="ghost" size="icon" onClick={handleToggleStatus} disabled={isUpdating || !isReady} aria-label={t('community_page_mark_done_label')}>
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
                                <Button variant="ghost" size="sm" className="relative" disabled={!isReady}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    {t('community_page_comment_button')}
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </CardFooter>
                </div>
                <CollapsibleContent>
                   <CommentThread message={message} canManage={canManage} />
                </CollapsibleContent>
            </Card>
        </Collapsible>
        )
}

function Network({ communityId, isOwner, allMembers }: { communityId: string; isOwner: boolean, allMembers: Member[] }) {
    const { user } = useUser();
    const { t } = useTranslation();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMessages = useCallback(() => {
        if (!firestore || !communityId) {
            setIsLoading(false);
            return () => {};
        }
        setIsLoading(true);
        setError(null);
        
        const messagesQuery = query(collection(firestore, `communities/${communityId}/messages`), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(messagesQuery, 
            (snapshot) => {
                const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
                setMessages(messagesData);
                setIsLoading(false);
            }, 
            (err) => {
                console.error("Error fetching messages:", err);
                setError(err);
                setIsLoading(false);
            }
        );
        
        return unsubscribe;
    }, [communityId]);
    
    useEffect(() => {
        const unsubscribe = fetchMessages();
        return () => unsubscribe();
    }, [fetchMessages]);

    const filteredMessages = useMemo(() => {
        return messages.filter(msg => {
            if (msg.audience === 'owner') {
                return isOwner;
            }
            return true; // Public messages
        });
    }, [messages, isOwner]);

    const handleMessageSent = () => {
        // No longer needed to manually trigger, but kept for potential future use
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2"><MessageSquare /> {t('community_page_network_title')}</CardTitle>
                        <CardDescription>{t('community_page_network_desc')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && <LoaderCircle className="mx-auto animate-spin" />}
                {error && <p className="text-destructive">{t('community_page_load_messages_error', { message: error.message })}</p>}
                {!isLoading && filteredMessages && filteredMessages.length === 0 && <p className="text-muted-foreground text-center py-8">{t('community_page_no_messages')}</p>}
                <div className="max-h-[40rem] overflow-y-auto space-y-4 pr-2">
                    {filteredMessages?.map(msg => {
                        const key = msg.id || `${msg.userId}-${msg.createdAt?.seconds || Date.now()}`;
                        return <MessageCard key={key} message={msg} canManage={isOwner || msg.userId === user?.uid}/>
                    })}
                </div>
            </CardContent>
            {user ? (
                <div className="border-t p-4 space-y-4">
                    <TextMessageForm communityId={communityId} onMessageSent={handleMessageSent} />
                </div>
            ) : (
                <div className="border-t p-4 text-center">
                    <Button asChild>
                        <Link href="/login">
                            <LogIn className="mr-2" />
                            {t('community_page_login_to_message')}
                        </Link>
                    </Button>
                </div>
            )}
        </Card>
    )
}

export default function CommunityProfilePage() {
  const params = useParams();
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [isGeneratingFlag, setIsGeneratingFlag] = useState(false);

  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { translatedText: translatedName } = useDynamicTranslation(community?.name);
  const { translatedText: translatedDescription } = useDynamicTranslation(community?.description);

  const [userProfile, setUserProfile] = useState<CommunityProfile | null>(null);

  const [userJoinRequest, setUserJoinRequest] = useState<JoinRequest | null>(null);
  const [isRequestLoading, setIsRequestLoading] = useState(true);
  
  const [allProfiles, setAllProfiles] = useState<CommunityProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  useEffect(() => {
    if (!id || !firestore) {
        setIsLoading(false);
        return;
    };
    const communityDocRef = doc(firestore, 'communities', id);
    const unsubscribe = onSnapshot(communityDocRef, (doc) => {
        setCommunity(doc.exists() ? { id: doc.id, ...doc.data() } as Community : null);
        setIsLoading(false);
    }, (err) => {
        setError(err as Error);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!firestore) return;
    const fetchProfiles = async () => {
        setIsLoadingProfiles(true);
        try {
            const profilesQuery = query(collection(firestore, 'community-profiles'));
            const snapshot = await getDocs(profilesQuery);
            const profiles = snapshot.docs.map(doc => doc.data() as CommunityProfile);
            setAllProfiles(profiles);
        } catch (error) {
            console.error("Error fetching all profiles:", error);
        } finally {
            setIsLoadingProfiles(false);
        }
    };
    fetchProfiles();
  }, []);

  const suggestedUsers = useMemo(() => {
    if (!community || !allProfiles) return [];
    const memberIds = new Set(community.members.map(m => m.userId));
    return allProfiles.filter(p => p.userId !== user?.uid && !memberIds.has(p.userId));
  }, [community, allProfiles, user]);


  useEffect(() => {
    if (user && firestore) {
        const fetchUserProfile = async () => {
            const profileDocRef = doc(firestore, 'community-profiles', user.uid);
            const docSnap = await getDoc(profileDocRef);
            setUserProfile(docSnap.exists() ? docSnap.data() as CommunityProfile : null);
        };
        fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (user && id && firestore) {
        setIsRequestLoading(true);
        const requestDocRef = doc(firestore, 'communities', id, 'joinRequests', user.uid);
        const unsubscribe = onSnapshot(requestDocRef, (docSnap) => {
            setUserJoinRequest(docSnap.exists() ? docSnap.data() as JoinRequest : null);
            setIsRequestLoading(false);
        }, (error) => {
            console.error("Error fetching join request:", error);
            setIsRequestLoading(false);
        });
        return () => unsubscribe();
    } else {
        setIsRequestLoading(false);
    }
  }, [user, id]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = useMemo(() => user?.uid === community?.ownerId, [user, community]);
  
  const allMembers = useMemo(() => {
    if (!community?.members) return [];
    return [...community.members].sort((a, b) => {
      if (a.type === 'human' && b.type !== 'human') return -1;
      if (a.type !== 'human' && b.type === 'human') return 1;
      return 0;
    });
  }, [community]);

  const isMember = useMemo(() => {
    if (!user || !community) return false;
    if (user.uid === community.ownerId) return true;
    return community.members.some(member => member.type === 'human' && member.userId === user.uid);
}, [user, community]);


  const handleRequestToJoin = async () => {
    if (!user || !id || !userProfile || !firestore || !community) {
        toast({ variant: 'destructive', title: t('community_page_error'), description: t('community_page_login_profile_error') });
        return;
    }
    setIsSubmitting(true);
    
    const requestRef = doc(firestore, `communities/${id}/joinRequests/${user.uid}`);

    const newRequest: Omit<JoinRequest, 'id' | 'createdAt'> = {
        userId: user.uid,
        userName: userProfile.name,
        userBio: userProfile.bio,
        status: 'pending' as const,
    };
    try {
        await setDoc(requestRef, {...newRequest, createdAt: serverTimestamp()});
        await notifyOwnerOfJoinRequestAction({
            communityId: community.id,
            communityName: community.name,
            requestingUserName: userProfile.name,
        });
        toast({ title: t('community_page_request_sent_title'), description: t('community_page_request_sent_desc') });
    } catch(e) {
        const message = e instanceof Error ? e.message : t('community_page_unexpected_error');
        toast({ variant: 'destructive', title: t('community_page_send_request_fail_title'), description: message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleInvite = async (profile: CommunityProfile) => {
    if (!community || !firestore) return;
    
    const newMember: Member = {
        userId: profile.userId,
        name: profile.name,
        bio: profile.bio,
        role: 'Member',
        type: 'human',
        avatarUrl: profile.avatarUrl || '',
    };
    const communityDocRef = doc(firestore, 'communities', community.id);
    await updateDoc(communityDocRef, {
        members: arrayUnion(newMember)
    });

    await welcomeNewMemberAction({ communityId: community.id, communityName: community.name, newMemberName: newMember.name });

    toast({
        title: t('community_page_member_invited_title'),
        description: t('community_page_member_invited_desc', { name: profile.name })
    })
  };

  const handleRemoveMember = async (memberToRemove: Member) => {
    if (!community || !firestore) {
      toast({ variant: "destructive", title: t('community_page_community_not_found') });
      return;
    }

    const isRemovingSelf = user?.uid === memberToRemove.userId;
    if (isOwner && isRemovingSelf) {
        toast({ variant: "destructive", title: t('community_page_owner_leave_error')});
        return;
    }
    
    const communityDocRef = doc(firestore, 'communities', community.id);
    try {
      await updateDoc(communityDocRef, {
        members: arrayRemove(memberToRemove)
      });
      toast({ title: t('community_page_member_removed_title'), description: t('community_page_member_removed_desc', { name: memberToRemove.name }) });
      // UI will update via onSnapshot
    } catch (e) {
      const message = e instanceof Error ? e.message : t('community_page_unexpected_error');
      toast({ variant: "destructive", title: t('community_page_remove_member_fail_title'), description: message });
    }
  };


  const handleGenerateFlag = async () => {
    if (!community || !user || !firestore) {
      toast({
        variant: 'destructive',
        title: t('community_page_missing_info_title'),
        description: t('community_page_missing_info_desc'),
      });
      return;
    }

    setIsGeneratingFlag(true);
    toast({
      title: t('community_page_generating_flag_title'),
      description: t('community_page_generating_flag_desc'),
    });

    try {
      const idToken = await user.getIdToken();
      const result = await generateCommunityFlagAction({
        communityId: community.id,
        communityName: community.name,
        communityDescription: community.description,
        idToken,
      });

      if (result.error) {
        throw new Error(result.error);
      }
      
      const communityRef = doc(firestore, 'communities', community.id);
      await updateDoc(communityRef, { flagUrl: result.data.flagUrl });

      toast({
        title: t('community_page_new_flag_title'),
        description: t('community_page_new_flag_desc'),
      });

    } catch (e) {
      const message = e instanceof Error ? e.message : t('community_page_unexpected_error');
      toast({
        variant: 'destructive',
        title: t('community_page_flag_fail_title'),
        description: message,
      });
    } finally {
      setIsGeneratingFlag(false);
    }
  };


  if (isLoading || isRequestLoading || isLoadingProfiles) {
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
            <CardTitle className="mt-4">{t('community_page_error_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {t('community_page_error_desc')}
            </p>
            <pre className="mb-4 text-left text-sm bg-muted p-2 rounded-md overflow-x-auto">
              <code>{error.message}</code>
            </pre>
            <Button asChild variant="outline">
              <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('community_page_back_all_button')}
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
              <CardTitle>{t('community_page_not_found_title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{t('community_page_not_found_desc')}</p>
              <Button asChild variant="outline">
              <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('community_page_back_all_button')}
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
                {t('community_page_back_all_button')}
            </Link>
        </Button>
      </div>

       <div className="mb-8">
            <div className="relative rounded-lg overflow-hidden border-2 border-primary aspect-[16/9] bg-muted flex items-center justify-center">
                {community.flagUrl ? (
                    <Image src={community.flagUrl} alt={`${community.name} Flag`} fill style={{ objectFit: 'cover' }} />
                ) : (
                    <div className="text-center text-muted-foreground">
                        <Flag className="h-12 w-12 mx-auto" />
                        <p>{t('community_page_no_flag')}</p>
                    </div>
                )}
                {isOwner && (
                    <div className="absolute top-2 right-2">
                        <Button variant="secondary" size="sm" onClick={handleGenerateFlag} disabled={isGeneratingFlag}>
                            {isGeneratingFlag ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {t('community_page_regenerate_flag_button')}
                        </Button>
                    </div>
                )}
            </div>
            <div className="text-center mt-4">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
                {translatedName}
                </h1>
                <p className="text-lg text-accent-foreground mt-2">{translatedDescription}</p>
            </div>
        </div>
      
      <PresentationHall communityId={community.id} />

      {!isMember && (
         <Card className="shadow-lg mb-12 border-2 border-primary bg-primary/5">
            <CardHeader className="items-center text-center">
                <CardTitle className="text-2xl">{t('community_page_join_title', { name: community.name })}</CardTitle>
                <CardDescription>{t('community_page_join_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                {!user ? (
                    <Button asChild><Link href="/login"><LogIn className="mr-2 h-4 w-4" />{t('community_page_login_to_join_button')}</Link></Button>
                ) : userJoinRequest?.status === 'pending' ? (
                    <Button disabled><Hourglass className="mr-2 h-4 w-4 animate-spin" />{t('community_page_request_pending_button')}</Button>
                ) : (
                    <Button onClick={handleRequestToJoin} disabled={isSubmitting}><PlusCircle className="mr-2 h-4 w-4" />{t('community_request_to_join')}</Button>
                )}
            </CardContent>
        </Card>
      )}

      <Card className="shadow-lg mb-12 border-2 border-primary">
        <CardHeader>
          <CardTitle>{t('community_page_welcome_message_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{community.welcomeMessage}</p>
        </CardContent>
         {isMember && !isOwner && (
            <CardFooter>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive"><LogOut className="mr-2 h-4 w-4" />{t('community_page_leave_button')}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('community_page_leave_dialog_title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('community_page_leave_dialog_desc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('community_page_delete_cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveMember(community.members.find(m => m.userId === user.uid)!)} className="bg-destructive hover:bg-destructive/90">
                                {t('community_page_leave_confirm')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        )}
      </Card>
      
      <Card className="shadow-lg mb-12">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">{t('community_page_meet_members_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6">
            {allMembers.map((member) => (
              <MemberCard key={member.userId || member.name} member={member} communityId={community.id} isOwner={isOwner} onRemove={handleRemoveMember} />
            ))}
          </div>
        </CardContent>
      </Card>
      
       {isMember && (
        <Card className="shadow-lg my-12">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench /> {t('community_page_tools_title')}</CardTitle>
                <CardDescription>{t('community_page_tools_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="h-auto py-4">
                    <Link href={`/community/${id}/workshop`} className="flex flex-col items-center gap-2">
                        <Sparkles className="w-8 h-8 text-primary" />
                        <span className="font-semibold">{t('community_page_tool_workshop')}</span>
                        <div className="mt-2 text-xs text-center text-muted-foreground">{t('community_page_tool_workshop_desc')}</div>
                    </Link>
                </Button>
                 <Button asChild variant="outline" className="h-auto py-4">
                     <Link href={`/community/${id}/roadmap`} className="flex flex-col items-center gap-2">
                        <KanbanIcon className="w-8 h-8 text-primary" />
                        <span className="font-semibold">{t('community_page_tool_roadmap')}</span>
                        <div className="mt-2 text-xs text-center text-muted-foreground">{t('community_page_tool_roadmap_desc')}</div>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4">
                     <Link href={`/community/${id}/treasury`} className="flex flex-col items-center gap-2">
                        <Banknote className="w-8 h-8 text-primary" />
                        <span className="font-semibold">{t('community_page_tool_treasury')}</span>
                        <div className="mt-2 text-xs text-center text-muted-foreground">{t('community_page_tool_treasury_desc')}</div>
                    </Link>
                </Button>
            </CardContent>
        </Card>
      )}
      
       <div className="my-12">
        <Network communityId={community.id} isOwner={isOwner} allMembers={allMembers} />
       </div>
      
      {isOwner && (
         <>
            <Separator className="my-12" />
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>{t('community_page_join_requests_title')}</CardTitle>
                    <CardDescription>{t('community_page_join_requests_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <JoinRequests communityId={id} communityName={community.name} />
                </CardContent>
            </Card>
        </>
      )}

      <Separator className="my-12" />
      
      {isOwner && (
        <>
            <Separator className="my-12" />
            <div>
                <h2 className="text-3xl font-bold text-center mb-8">{t('community_page_invite_title')}</h2>
                {isLoadingProfiles ? (
                    <LoaderCircle className="animate-spin mx-auto" />
                ) : suggestedUsers.length > 0 ? (
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
                                    {t('community_page_invite_button')}
                                </Button>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="flex items-center justify-center p-8">
                        <p className="text-muted-foreground">{t('community_page_all_users_members')}</p>
                    </Card>
                )}
            </div>
        </>
      )}

    </main>
  );
}

