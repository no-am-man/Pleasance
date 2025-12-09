import { configureGenkit } from '@genkit-ai/core';
import { googleAI, gemini15Pro } from '@genkit-ai/google-genai';
import { dotprompt } from '@genkit-ai/dotprompt';

export default configureGenkit({
  // 1. Plugins: Configure the providers you need
  plugins: [
    googleAI({
      // CRITICAL FIX: Forces the beta API which supports JSON schemas
      apiVersion: 'v1beta', 
    }),
    dotprompt(), // Recommended: Enables support for .prompt files
  ],

  // 2. Telemetry: Essential for debugging flow history in the Developer UI
  logLevel: 'debug', // Change to 'info' or 'warn' for production
  enableTracingAndMetrics: true, 

  // 3. Storage: Where to keep flow states and traces
  // 'firebase' requires the firebase-admin SDK to be initialized
  flowStateStore: 'firebase', 
  traceStore: 'firebase',     
});
