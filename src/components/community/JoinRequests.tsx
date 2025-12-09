// src/components/community/JoinRequests.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, arrayUnion, updateDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Check, X } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { welcomeNewMemberAction } from '@/app/actions';
import { useTranslation } from '@/hooks/use-translation';
import type { JoinRequest, CommunityProfile, Member } from '@/lib/types';


export function JoinRequests({ communityId, communityName }: { communityId: string, communityName: string }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const { isUserLoading } = useUser();
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        const { firestore } = getFirebase();
        if (!firestore || !communityId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const requestsQuery = query(collection(firestore, `communities/${communityId}/joinRequests`), where('status', '==', 'pending'));
            const querySnapshot = await getDocs(requestsQuery);
            const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JoinRequest));
            setRequests(requestsData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [communityId]);

    useEffect(() => {
        if (!isUserLoading) {
            fetchRequests();
        }
    }, [isUserLoading, fetchRequests]);

    const handleRequest = async (request: JoinRequest, newStatus: 'approved' | 'rejected') => {
        const { firestore } = getFirebase();
        if (!firestore) {
            toast({ variant: 'destructive', title: t('community_page_firestore_not_available') });
            return;
        }
        const requestDocRef = doc(firestore, `communities/${communityId}/joinRequests`, request.id);
        const communityDocRef = doc(firestore, 'communities', communityId);
        
        try {
            if (newStatus === 'approved') {
                // Fetch the full profile to get all details
                const profileSnap = await getDoc(doc(firestore, 'community-profiles', request.userId));
                const profileData = profileSnap.exists() ? profileSnap.data() as CommunityProfile : null;
                
                if (profileData) {
                    const newMemberIdentifier = profileData.userId;

                    await updateDoc(communityDocRef, {
                        members: arrayUnion(newMemberIdentifier)
                    });
                    
                    await welcomeNewMemberAction({ communityId, communityName, newMemberName: profileData.name });
                } else {
                    throw new Error("Could not find user profile to add member.");
                }
            }
            // After action, delete the request document instead of updating its status
            await deleteDoc(requestDocRef);

            toast({ title: t('community_page_request_status_toast', { status: newStatus }) });
            fetchRequests(); // Refresh the list
        } catch (error) {
            const message = error instanceof Error ? error.message : t('community_page_unexpected_error');
            toast({ variant: 'destructive', title: t('community_page_request_update_fail_title', { status: newStatus }), description: message });
        }
    };

    if (isLoading) {
        return <LoaderCircle className="animate-spin mx-auto" />
    }
    
    if (!requests || requests.length === 0) {
        return <p className="text-muted-foreground text-center py-4">{t('community_page_no_join_requests')}</p>;
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
                        <Button size="sm" onClick={() => handleRequest(req, 'approved')}><Check className="mr-2" />{t('community_page_approve_button')}</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRequest(req, 'rejected')}><X className="mr-2" />{t('community_page_decline_button')}</Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
