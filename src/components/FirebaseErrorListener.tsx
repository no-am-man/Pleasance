'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { AlertTriangle } from 'lucide-react';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Throw the error in development to make it visible in the Next.js overlay
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }

      // In production, you might want to show a toast or log to a monitoring service
      console.error("Caught permission error:", error.message);
      
      toast({
        variant: 'destructive',
        duration: 20000, 
        title: (
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Firestore Permission Denied
            </div>
        ),
        description: (
          <div className="mt-2 w-full rounded-md bg-slate-950 p-4">
            <p className="text-white text-xs whitespace-pre-wrap">A database operation was blocked by your security rules.</p>
          </div>
        ),
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
