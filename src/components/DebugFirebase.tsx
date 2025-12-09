"use client";
import { useEffect, useState } from "react";
import { getFirebase } from "@/firebase/config";

export default function DebugFirebase() {
  const [status, setStatus] = useState("Checking...");
  const [debugInfo, setDebugInfo] = useState({
    apiKey: '',
    projectId: '',
    origin: '',
  });

  useEffect(() => {
    const runTest = async () => {
      try {
        const { app, auth, firestore } = getFirebase();
        const user = auth.currentUser;
        
        const config = app.options;
        const currentApiKey = config.apiKey || 'Not Found';
        const currentProjectId = config.projectId || 'Not Found';
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'Unknown';

        setDebugInfo({
            apiKey: currentApiKey,
            projectId: currentProjectId,
            origin: currentOrigin,
        });

        let report = `1. App Initialized: ✅\n`;
        report += `2. Auth State: ${user ? "✅ Logged In" : "⚠️ Anonymous"}\n`;

        // Test Public Read (Communities)
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Give auth time
          const response = await fetch(`https://firestore.googleapis.com/v1/projects/${currentProjectId}/databases/(default)/documents/communities`, {
            headers: { 'x-goog-api-key': currentApiKey }
          });
          if (response.ok) {
            report += `3. Public DB Read: ✅ Success`;
          } else {
            const errorText = await response.text();
            let errorCode = 'Unknown';
            try {
                const errorJson = JSON.parse(errorText);
                errorCode = errorJson.error?.status || 'Unknown';
            } catch {}
            report += `3. Public DB Read: ❌ FAILED (${errorCode})`;
          }
        } catch (e: any) {
          report += `3. Public DB Read: ❌ FAILED (Network Error)`;
        }

        setStatus(report);
      } catch (e: any) {
        setStatus(`CRITICAL ERROR: ${e.message}`);
      }
    };
    
    // Run after a short delay to let Auth initialize
    const timer = setTimeout(runTest, 2500);
    return () => clearTimeout(timer);
  }, []);

  const apiKeyUrl = `https://console.cloud.google.com/apis/credentials?project=${debugInfo.projectId}`;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black text-white font-mono text-xs rounded-lg shadow-2xl z-50 border border-yellow-500 max-w-lg">
      <h4 className="font-bold text-yellow-300 mb-2">Firebase Status & Action Required</h4>
      <pre className="text-green-400 whitespace-pre-wrap">{status}</pre>
      {status.includes('FAILED (PERMISSION_DENIED)') && (
        <div className="mt-3 pt-3 border-t border-yellow-700">
            <p className="text-yellow-300 font-bold">To Fix This:</p>
            <ol className="list-decimal list-inside text-yellow-200 space-y-1 mt-1">
                <li>
                    Go to: <a href={apiKeyUrl} target="_blank" rel="noopener noreferrer" className="underline text-cyan-400 hover:text-cyan-200">API Key Settings</a>
                </li>
                <li>Find the key ending in: <strong className="text-white">...{debugInfo.apiKey.slice(-4)}</strong></li>
                <li>Click it, go to "Website restrictions", and add this URL: <strong className="text-white">{debugInfo.origin}</strong></li>
            </ol>
        </div>
      )}
    </div>
  );
}
