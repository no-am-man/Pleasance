// src/app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, LogIn, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc } from 'firebase/firestore';

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'community-profiles', user.uid);
  }, [user, firestore]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };
  
  const handleSignOut = async () => {
    await signOut(auth);
  }

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading) {
      if (user) {
        if (profile) {
          router.push('/community');
        } else {
          router.push('/profile');
        }
      }
    }
  }, [user, isUserLoading, profile, isProfileLoading, router]);
  
  if (isUserLoading || isProfileLoading || (user && !isSigningIn)) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
            {user ? (
                <>
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'}/>
                            <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CardTitle>Welcome Back</CardTitle>
                        <CardDescription>{user.displayName || user.email}</CardDescription>
                    </div>
                </>
            ) : (
                <>
                    <CardTitle>Join the Community</CardTitle>
                    <CardDescription>Sign in to continue to LinguaTune</CardDescription>
                </>
            )}
        </CardHeader>
        <CardContent>
            {user ? (
                 <div className="flex flex-col space-y-4">
                    <Button onClick={() => router.push('/community')}>Go to Community</Button>
                    <Button variant="outline" onClick={handleSignOut}>
                        <LogOut className="mr-2" /> Sign Out
                    </Button>
                 </div>
            ) : (
                <div className="flex flex-col space-y-4">
                    <Button onClick={handleGoogleSignIn} disabled={isSigningIn} className="w-full">
                        {isSigningIn ? (
                            <LoaderCircle className="mr-2 animate-spin" />
                        ) : (
                            <GoogleIcon />
                        )}
                        Sign in with Google
                    </Button>
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                </div>
            )}
        </CardContent>
      </Card>
    </main>
  );
}
