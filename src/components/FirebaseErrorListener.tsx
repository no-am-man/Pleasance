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
      console.error("Caught permission error:", error.message);
      
      // We use a toast to display the error to the user in the UI.
      toast({
        variant: 'destructive',
        duration: 20000, // Keep the toast open for 20 seconds
        title: (
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Firestore Permission Denied
            </div>
        ),
        description: (
          <pre className="mt-2 w-full rounded-md bg-slate-950 p-4">
            <code className="text-white text-xs whitespace-pre-wrap">{error.message}</code>
          </pre>
        ),
      });
    };

    // Subscribe to the 'permission-error' event
    errorEmitter.on('permission-error', handlePermissionError);

    // Clean up the subscription when the component unmounts
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null; // This component does not render anything itself
}
