// src/app/community/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, errorEmitter, FirestorePermissionError, getFirebase } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, where, arrayUnion, arrayRemove, updateDoc, getDoc, getDocs, setDoc, onSnapshot, Unsubscribe, addDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, AlertCircle, ArrowLeft, Bot, User, PlusCircle, Send, MessageSquare, LogIn, Check, X, Hourglass, CheckCircle, Circle, Undo2, Ban, RefreshCw, Flag, Save, Download, Sparkles, Presentation, KanbanIcon, Info, LogOut, Wrench, Banknote, UserX, CornerDownRight, BookOpen, Trash2, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { generateCommunityFlagAction, welcomeNewMemberAction, notifyOwnerOfJoinRequestAction, echoThoughtFormAction } from '@/app/actions';
import { addDocument } from '@/firebase/db-updates';
import { PresentationHall } from '@/components/community/PresentationHall';
import { JoinRequests } from '@/components/community/JoinRequests';
import { MemberCard } from '@/components/community/MemberCard';
import { useTranslation } from '@/hooks/use-translation';
import { useDynamicTranslation } from '@/hooks/use-dynamic-translation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Member, Community, Form, CommunityProfile } from '@/lib/types';


function TextFormForm({ communityId, onFormSent }: { communityId: string, onFormSent: () => void }) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !user) return;
        
        const { firestore } = getFirebase();
        if (!firestore) return;

        setIsSubmitting(true);
        
        const formsColRef = collection(firestore, `communities/${communityId}/forms`);
        
        const newForm = {
            communityId,
            originCommunityId: communityId, // Initially, origin is the current community
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
            await addDocument(formsColRef, newForm);
            setText('');
            onFormSent();
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

function EchoFormDialog({ form, userCommunities }: { form: Form; userCommunities: Community[] }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isEchoing, setIsEchoing] = useState(false);
    const [selectedCommunity, setSelectedCommunity] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();

    const handleEcho = async () => {
        if (!user || !selectedCommunity) {
            toast({ variant: "destructive", title: "Selection Required", description: "Please select a community to echo to." });
            return;
        }
        setIsEchoing(true);
        try {
            const result = await echoThoughtFormAction({
                sourceCommunityId: form.communityId,
                sourceFormId: form.id,
                targetCommunityId: selectedCommunity,
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userAvatarUrl: user.photoURL || undefined,
            });
            toast({ title: "Successfully Echoed!", description: `The thought-form has been echoed to the selected community.` });
            setIsOpen(false);
        } catch (e) {
            const message = e instanceof Error ? e.message : "An unexpected error occurred.";
            toast({ variant: "destructive", title: "Echo Failed", description: message });
        } finally {
            setIsEchoing(false);
        }
    };
    
    const availableCommunities = userCommunities.filter(c => c.id !== form.communityId);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    {t('echo_form_button')}
                </Button>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>{t('echo_form_title')}</DialogTitle>
                    <DialogDescription>
                        {t('echo_form_desc')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Card className="p-4 bg-muted">
                        <p className="text-sm font-medium">"{form.text}"</p>
                        <p className="text-xs text-muted-foreground mt-1">- {form.userName}</p>
                    </Card>
                    
                    {availableCommunities.length > 0 ? (
                         <Select onValueChange={setSelectedCommunity} value={selectedCommunity}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a community..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCommunities.map(community => (
                                    <SelectItem key={community.id} value={community.id}>
                                        {community.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">You are not a member of any other communities to echo this to.</p>
                    )}
                   
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleEcho} disabled={isEchoing || !selectedCommunity || availableCommunities.length === 0}>
                        {isEchoing ? <LoaderCircle className="animate-spin mr-2" /> : <GitBranch className="mr-2 h-4 w-4" />}
                        Confirm Echo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FormBubble({ form, allCommunities, userCommunities, isMember, onClick }: { form: Form; allCommunities: Community[]; userCommunities: Community[]; isMember: boolean; onClick: () => void }) {
    const originCommunity = allCommunities.find(c => c.id === form.originCommunityId);
    const { t } = useTranslation();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            whileHover={{ scale: 1.02, zIndex: 10 }}
            className="w-full max-w-lg mx-auto cursor-pointer -mt-8 first:mt-0 group"
            onClick={onClick}
        >
            <Card className="bg-card shadow-lg flex items-center gap-3 p-3">
                <Avatar className="w-10 h-10 border-2 border-background flex-shrink-0">
                    <AvatarImage src={form.userAvatarUrl || `https://i.pravatar.cc/150?u=${form.userId}`} alt={form.userName} />
                    <AvatarFallback>{form.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{form.userName}</span>
                        {form.communityId !== form.originCommunityId && originCommunity && (
                            <>
                                <CornerDownRight className="w-3 h-3" />
                                <span className="font-semibold truncate">{originCommunity.name}</span>
                            </>
                        )}
                    </div>
                    <p className="font-medium text-sm text-foreground mt-0.5 line-clamp-2">{form.text}</p>
                </div>
                 {isMember && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <EchoFormDialog form={form} userCommunities={userCommunities} />
                    </div>
                )}
                 {originCommunity?.flagUrl && (
                    <div className="w-8 h-8 flex-shrink-0 relative">
                        <Image src={originCommunity.flagUrl} alt={`${originCommunity.name} Flag`} fill className="rounded-full object-cover border border-border" />
                    </div>
                )}
            </Card>
        </motion.div>
    );
}


function SphericalizingChatRoom({ communityId, isOwner, allMembers, allCommunities, userCommunities, isMember }: { communityId: string; isOwner: boolean, allMembers: Member[], allCommunities: Community[], userCommunities: Community[], isMember: boolean }) {
    const { user } = useUser();
    const { t } = useTranslation();
    const { firestore } = getFirebase();
    
    const [forms, setForms] = useState<Form[]>([]);
    const [visibleForms, setVisibleForms] = useState<Form[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore || !communityId) {
            setIsLoading(false);
            return () => {};
        }
        setIsLoading(true);
        setError(null);
        
        const formsQuery = query(collection(firestore, `communities/${communityId}/forms`), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(formsQuery, 
            (snapshot) => {
                const formsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Form));
                setForms(formsData);
                setIsLoading(false);
            }, 
            (err) => {
                const permissionError = new FirestorePermissionError({
                    path: `communities/${communityId}/forms`,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setError(err);
                setIsLoading(false);
            }
        );
        
        return unsubscribe;
    }, [communityId, firestore]);

    useEffect(() => {
        const filtered = forms.filter(form => form.audience !== 'owner' || isOwner);
        setVisibleForms(filtered);
    }, [forms, isOwner]);

    const handleBubbleClick = (formId: string) => {
        setVisibleForms(prev => prev.filter(f => f.id !== formId));
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">{t('community_page_ccn_title')}</CardTitle>
                        <CardDescription>{t('community_page_ccn_desc_spheres')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {user ? (
                    <div className="p-4 border-b">
                        <TextFormForm communityId={communityId} onFormSent={() => {}} />
                    </div>
                ) : (
                    <div className="p-4 text-center border-b">
                        <Button asChild>
                            <Link href="/login">
                                <LogIn className="mr-2" />
                                {t('community_page_login_to_message')}
                            </Link>
                        </Button>
                    </div>
                )}
                {isLoading && <LoaderCircle className="mx-auto animate-spin" />}
                {error && <p className="text-destructive">{t('community_page_load_messages_error', { message: error.message })}</p>}
                
                <div className="h-[500px] overflow-y-auto bg-muted/20 rounded-lg p-8 flex flex-col items-center">
                    <AnimatePresence>
                        {visibleForms?.map(form => {
                            const key = form.id || `${form.userId}-${form.createdAt?.seconds || Date.now()}`;
                            return <FormBubble key={key} form={form} allCommunities={allCommunities} userCommunities={userCommunities} isMember={isMember} onClick={() => handleBubbleClick(form.id)} />
                        })}
                    </AnimatePresence>
                    {!isLoading && visibleForms && visibleForms.length === 0 && <p className="flex items-center justify-center text-muted-foreground text-center h-full">{t('community_page_no_messages')}</p>}
                </div>
            </CardContent>
        </Card>
    )
}

export default function CommunityProfilePage() {
  const params = useParams();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { firestore } = getFirebase();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [isGeneratingFlag, setIsGeneratingFlag] = useState(false);

  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { translatedText: translatedName } = useDynamicTranslation(community?.name);
  const { translatedText: translatedDescription } = useDynamicTranslation(community?.description);

  const [userProfile, setUserProfile] = useState<CommunityProfile | null>(null);
  
  const [allProfiles, setAllProfiles] = useState<CommunityProfile[]>([]);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [isLoadingAncillary, setIsLoadingAncillary] = useState(true);
  
  const [userJoinRequest, setUserJoinRequest] = useState<any | null>(null);

  // Effect for fetching ancillary data (runs once)
  useEffect(() => {
    if (!firestore) {
      setIsLoadingAncillary(false);
      return;
    }
    const fetchAncillaryData = async () => {
      setIsLoadingAncillary(true);
      try {
        const [communitiesSnapshot, profilesSnapshot] = await Promise.all([
          getDocs(query(collection(firestore, 'communities'))),
          getDocs(query(collection(firestore, 'community-profiles'))),
        ]);
        const allComms = communitiesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Community));
        setAllCommunities(allComms);
        setAllProfiles(profilesSnapshot.docs.map(d => ({id: d.id, ...d.data()} as CommunityProfile)));

        if (user) {
            const userComms = allComms.filter(c => c.members.some(m => {
                if (typeof m === 'object' && m !== null && 'userId' in m) {
                    return m.userId === user.uid;
                }
                return false;
            }));
            setUserCommunities(userComms);
        }
      } catch (e) {
        console.error("Error fetching ancillary data:", e);
      } finally {
        setIsLoadingAncillary(false);
      }
    };
    fetchAncillaryData();
  }, [user, firestore]);

  // Effect for the main community document (real-time)
  useEffect(() => {
    if (!id || !firestore) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const communityDocRef = doc(firestore, 'communities', id);
    const unsubscribeCommunity = onSnapshot(communityDocRef, (doc) => {
      setCommunity(doc.exists() ? { id: doc.id, ...doc.data() } as Community : null);
      setIsLoading(false);
    }, (err) => {
      const permissionError = new FirestorePermissionError({ path: `communities/${id}`, operation: 'get' });
      errorEmitter.emit('permission-error', permissionError);
      setError(err as Error);
      setIsLoading(false);
    });
    return () => unsubscribeCommunity();
  }, [id, firestore]);

  // Effect for user-specific data (profile and join request)
  useEffect(() => {
    if (isUserLoading || !user || !firestore || !id) {
        return;
    }
    let unsubscribeProfile: Unsubscribe;
    let unsubscribeJoinRequest: Unsubscribe;
    
    const profileDocRef = doc(firestore, 'community-profiles', user.uid);
    unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
      setUserProfile(docSnap.exists() ? docSnap.data() as CommunityProfile : null);
    });

    const requestDocRef = doc(firestore, `communities/${id}/joinRequests/${user.uid}`);
    unsubscribeJoinRequest = onSnapshot(requestDocRef, (docSnap) => {
      setUserJoinRequest(docSnap.exists() ? docSnap.data() as any : null);
    });
    
    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeJoinRequest) unsubscribeJoinRequest();
    };
  }, [id, user, isUserLoading, firestore]);


  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = useMemo(() => user?.uid === community?.ownerId, [user, community]);
  
  const allMembers = useMemo(() => {
    if (!community?.members) return [];
    return [...community.members].sort((a, b) => {
        if (typeof a === 'string' || typeof b === 'string') return 0;
        if (a.type === 'human' && b.type !== 'human') return -1;
        if (a.type !== 'human' && b.type === 'human') return 1;
        return 0;
    });
  }, [community]);

  const isMember = useMemo(() => {
    if (!user || !community) return false;
    return allMembers.some(member => typeof member !== 'string' && member.userId === user.uid);
}, [user, community, allMembers]);


  const handleRequestToJoin = async () => {
    if (!user || !id || !userProfile || !firestore || !community) {
        toast({ variant: 'destructive', title: t('community_page_error'), description: t('community_page_login_profile_error') });
        return;
    }
    setIsSubmitting(true);
    
    const requestRef = doc(firestore, `communities/${id}/joinRequests/${user.uid}`);

    const newRequest: Omit<any, 'id' | 'createdAt'> = {
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
      const memberIdentifierToRemove = community.members.find(m => {
          if (typeof m === 'string') return m === memberToRemove.userId;
          if (typeof m === 'object' && m !== null && 'userId' in m) {
            return m.userId === memberToRemove.userId;
          }
          return false;
      });

      if (!memberIdentifierToRemove) {
          throw new Error("Could not find the member in the community list to remove.");
      }
      
      await updateDoc(communityDocRef, {
        members: arrayRemove(memberIdentifierToRemove)
      });

      toast({ title: t('community_page_member_removed_title'), description: t('community_page_member_removed_desc', { name: memberToRemove.name }) });
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
      const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: t('community_page_flag_fail_title'),
        description: message,
      });
    } finally {
      setIsGeneratingFlag(false);
    }
  };


  if (isLoading || isUserLoading || isLoadingAncillary) {
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
              <Link href="/">
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
              <Link href="/">
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
            <Link href="/">
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

        <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-5">
                <TabsTrigger value="feed">{t('community_tab_feed')}</TabsTrigger>
                <TabsTrigger value="members">{t('community_tab_members')}</TabsTrigger>
                {isMember && <TabsTrigger value="tools">{t('community_tab_tools')}</TabsTrigger>}
                <TabsTrigger value="about">{t('community_tab_about')}</TabsTrigger>
                {isOwner && <TabsTrigger value="admin">{t('community_tab_admin')}</TabsTrigger>}
            </TabsList>
            <TabsContent value="feed" className="mt-6">
                <SphericalizingChatRoom communityId={community.id} isOwner={isOwner} allMembers={allMembers} allCommunities={allCommunities} userCommunities={userCommunities} isMember={isMember}/>
            </TabsContent>
            <TabsContent value="members" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">{t('community_page_meet_members_title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6">
                            {allMembers.map((member) => (
                                <MemberCard key={typeof member === 'string' ? member : (member.userId || member.name)} member={member} communityId={community.id} isOwner={isOwner} onRemove={handleRemoveMember} allProfiles={allProfiles}/>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                 {isOwner && (
                    <>
                        <Separator className="my-8" />
                        <Card>
                             <CardHeader>
                                <CardTitle>{t('community_page_invite_title')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoadingAncillary ? (
                                    <LoaderCircle className="animate-spin mx-auto" />
                                ) : allProfiles.length > 0 ? (
                                    <div className="space-y-4">
                                        {allProfiles.filter(p => !allMembers.some(m => {
                                            const memberId = typeof m === 'string' ? m : m.userId;
                                            return memberId === p.userId;
                                        })).map(profile => (
                                            <Card key={profile.id} className="flex items-center p-4">
                                                <Avatar className="w-12 h-12 mr-4">
                                                    <AvatarImage src={profile.avatarUrl || `https://i.pravatar.cc/150?u=${profile.name}`} alt={profile.name} />
                                                    <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-grow">
                                                    <Link href={`/profile/${profile.userId}`} className="font-bold underline">{profile.name}</Link>
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
                                    <p className="text-muted-foreground text-center py-4">{t('community_page_all_users_members')}</p>
                                )}
                            </CardContent>
                        </Card>
                    </>
                 )}
            </TabsContent>
            <TabsContent value="tools" className="mt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">{t('community_page_tools_title')}</CardTitle>
                        <CardDescription>{t('community_page_tools_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                         <Button asChild variant="outline" className="h-auto py-4">
                            <Link href={`/community/${id}/wiki`} className="flex flex-col items-center gap-2">
                                <BookOpen className="w-8 h-8 text-primary" />
                                <span className="font-semibold">Wiki</span>
                                <div className="mt-2 text-xs text-center text-muted-foreground">A shared knowledge base.</div>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="about" className="mt-6">
                <Card className="shadow-lg">
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
                                        <AlertDialogDescription>{t('community_page_leave_dialog_desc')}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t('community_page_delete_cancel')}</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => {
                                            const memberToRemove = allMembers.find(m => typeof m !== 'string' && m.userId === user?.uid);
                                            if (memberToRemove) {
                                                handleRemoveMember(memberToRemove as Member);
                                            }
                                        }} className="bg-destructive hover:bg-destructive/90">
                                            {t('community_page_leave_confirm')}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    )}
                </Card>
                 <div className="mt-8">
                    <PresentationHall communityId={community.id} />
                </div>
            </TabsContent>
            <TabsContent value="admin" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('community_page_join_requests_title')}</CardTitle>
                        <CardDescription>{t('community_page_join_requests_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <JoinRequests communityId={id} communityName={community.name} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

    </main>
  );
}
