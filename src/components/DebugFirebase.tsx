"use client";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getFirebase } from "@/firebase/config";

export default function DebugFirebase() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    const runTest = async () => {
      try {
        const { app, auth } = getFirebase();
        const user = auth.currentUser;
        
        let report = `1. App Initialized: ✅\n`;
        report += `2. Auth State: ${user ? "✅ Logged In as " + user.uid : "⚠️ WARNING: Anonymous (Guest)"}\n`;

        // Test Public Read (Communities)
        try {
          const { firestore } = getFirebase();
          await getDocs(collection(firestore, "communities"));
          report += `3. Public DB Read: ✅ Success\n`;
        } catch (e: any) {
          report += `3. Public DB Read: ❌ FAILED (${e.code})\n`;
        }

        setStatus(report);
      } catch (e: any) {
        setStatus(`CRITICAL ERROR: ${e.message}`);
      }
    };
    
    // Run after a short delay to let Auth initialize
    setTimeout(runTest, 2000);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-6 bg-black text-green-400 font-mono text-xs rounded-lg shadow-2xl z-50 whitespace-pre border border-green-500">
      {status}
    </div>
  );
}
